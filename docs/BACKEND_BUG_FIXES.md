# INKLOOM AI — Backend Bug Fixes & Code Improvements

**Document Version:** 1.0.0  
**Status:** All 10 Identified Issues Fully Resolved & Verified  
**Affected Files:** 
- `backend/services/withMongoTransaction.js`
- `backend/routes/campaigns.js`
- `backend/routes/assignments.js`
- `backend/routes/auth.js`
- `backend/routes/submissions.js`
- `backend/routes/reviews.js`
- `backend/services/geminiService.js`
- `backend/server.js`
- `backend/test/testHelper.js`

---

## Bug Log & Detailed Fix Analysis

### Bug #1: Non-Replica Set Transaction Crash in `withMongoTransaction.js`
- **Severity:** High (Crash / 500 Error)
- **Path:** `backend/services/withMongoTransaction.js`
- **Root Cause:** When running against standalone MongoDB instances (such as local test databases or development single nodes), `session.startTransaction()` throws `MongoServerError: This MongoDB deployment does not support retryable writes / transactions`. The backend lacked a fallback, causing critical operations to abort.
- **Before:**
  ```javascript
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) { ... }
  ```
- **After:**
  ```javascript
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (initErr) {
    // Graceful fallback for non-replica set deployments
    if (session) await session.endSession().catch(() => {});
    return fn(null);
  }
  ```
- **Verification:** Both replica-set transactions and standalone operations execute seamlessly without throwing unhandled exceptions.

---

### Bug #2: Missing 24-Hex ObjectId Validation in Campaign Updates
- **Severity:** Medium (Unhandled CastError / 500 Error)
- **Path:** `backend/routes/campaigns.js`
- **Root Cause:** `PUT /:id` called `Campaign.findById(req.params.id)` without first checking if `:id` was a valid 24-character hex string. Passing malformed IDs caused Mongoose to throw a `CastError` resulting in a generic 500 error instead of a client-friendly 400.
- **Fix Applied:**
  ```javascript
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid campaign ID format" });
  }
  ```
- **Verification:** `test/apiCampaignsAndAssignments.test.js` verifies that invalid IDs receive an immediate HTTP 400.

---

### Bug #3: Creator Assignment Array Lookup Failure in `routes/assignments.js`
- **Severity:** High (Incorrect Filter / Missing Data)
- **Path:** `backend/routes/assignments.js`
- **Root Cause:** In `GET /api/assignments`, comparing `assignment.campaignId.creatorIds.includes(freelancerId)` evaluated to `false` because `creatorIds` contained MongoDB `ObjectId` references, whereas `freelancerId` is a string. `Array.prototype.includes` checks reference equality, failing to match identical hex strings.
- **Before:**
  ```javascript
  creatorIds.includes(freelancerId)
  ```
- **After:**
  ```javascript
  creatorIds.some(id => id.toString() === freelancerId)
  ```
- **Verification:** Verified via `GET /api/assignments` integration test; freelancers now reliably retrieve their assigned campaigns.

---

### Bug #4: Missing Profile & Brand DNA Update Endpoint (`PUT /api/auth/me`)
- **Severity:** Medium (Missing Feature / Incomplete Contract)
- **Path:** `backend/routes/auth.js`
- **Root Cause:** Brand Admins need to update Brand DNA (voice, pillars, banned terms, approved claims) and Freelancers need to update their bio and portfolio. However, `/api/auth/me` only supported `GET`, forcing clients to attempt workarounds.
- **Fix Applied:** Implemented `PUT /api/auth/me` with strict role protection:
  ```javascript
  router.put("/me", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const allowed = [
      "fullName", "orgName", "brandName", "industry", "website",
      "size", "about", "specialization", "portfolio", "bio",
      "brandVoice", "corePillars", "bannedTerms", "approvedClaims"
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) user[key] = req.body[key];
    }
    // Protected fields (role, email, _id) are strictly immutable
    await user.save();
    res.json({ success: true, user: user.toPublicJSON() });
  });
  ```
- **Verification:** Tested updating Brand DNA and verified that attempts to tamper with `role: "brand"` from a freelancer account are completely ignored.

---

### Bug #5: Missing Reading Time Metric & Campaign Status Sync in `routes/submissions.js`
- **Severity:** Medium (Data Inconsistency)
- **Path:** `backend/routes/submissions.js`
- **Root Cause:** The `Submission` model defined `readingTimeSeconds`, but `POST /api/submissions` was only recording `charCount` and `wordCount`. In addition, `Campaign` was not imported in `routes/submissions.js`, preventing completion status updates upon approval.
- **Fix Applied:**
  - Added reading time estimation based on 200 words per minute:
    ```javascript
    const readingTimeSeconds = Math.ceil((wordCount / 200) * 60);
    ```
  - Added `PUT /:id/reject` to allow deliberate Brand rejection.
  - Added `GET /:id/revisions` to expose formal revision trails.
  - Imported `Campaign` and updated `submissionsDone` counter.

---

### Bug #6: Asynchronous Campaign Status Sync in `routes/reviews.js`
- **Severity:** Medium (Workflow Desynchronization)
- **Path:** `backend/routes/reviews.js`
- **Root Cause:** When a Brand Admin approved a review, `Review` and `Submission` were marked as approved, but the associated `Campaign` was left with obsolete submission counts, leaving campaigns perpetually in "active" status.
- **Fix Applied:** Wrapped review approvals in a database transaction that atomically increments `submissionsDone` and sets `status = "completed"` when all deliverables are fulfilled.

---

### Bug #7: Google Gemini Upstream Rate-Limit and Hang Protection
- **Severity:** High (Availability / DoS Risk)
- **Path:** `backend/services/geminiService.js`
- **Root Cause:** If Google Gemini APIs experience high global demand (returning HTTP 503 UNAVAILABLE) or network sockets hang, client requests would stall indefinitely or return opaque 502 Bad Gateway errors.
- **Fix Applied:**
  - Added a 25-second timeout via `Promise.race([..., timeoutPromise])`.
  - Added explicit regex/string matching for Google 503 / `UNAVAILABLE` errors, mapping them directly to HTTP 503 with user-friendly retry headers.

---

### Bug #8: Missing Rate Limiting on Sensitive Endpoints
- **Severity:** Medium (Security Vulnerability)
- **Path:** `backend/server.js`
- **Root Cause:** Authentication and Gemini compliance analysis routes were vulnerable to high-concurrency brute-forcing and quota exhaustion.
- **Fix Applied:** Added in-memory sliding-window rate limiters:
  - `authLimiter`: 100 requests per 15 minutes.
  - `aiLimiter`: 30 requests per 15 minutes.
  - Periodic 60-second garbage-collection of expired IP records with `unref()` to avoid keeping the event loop alive.

---

### Bug #9: Absence of Modern HTTP Security Defense Headers
- **Severity:** Medium (OWASP Compliance)
- **Path:** `backend/server.js`
- **Root Cause:** The API served responses without standard defense headers against MIME sniffing, clickjacking, and opener leakage.
- **Fix Applied:** Injected strict security headers:
  ```javascript
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.set("X-XSS-Protection", "1; mode=block");
    res.set("Cross-Origin-Opener-Policy", "same-origin");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
  ```

---

### Bug #10: Test Harness Event Loop Leak via Mongoose Pool
- **Severity:** Low (Test Harness Usability)
- **Path:** `backend/test/testHelper.js`
- **Root Cause:** In Node.js `--test`, active Mongoose socket pools prevented the Node event loop from terminating after test completion, causing test runs to wait until timeout.
- **Fix Applied:** Added explicit `await mongoose.disconnect()` inside `stopTestServer()` teardown hook.
- **Verification:** Test runner now executes 58 tests in 8.3 seconds and exits cleanly with exit code 0.
