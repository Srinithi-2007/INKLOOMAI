# INKLOOM AI — Localhost & Production Verification Guide

**Document Version:** 1.0.0  
**Status:** 100% Tested & Verified  
**Runtime Engine:** Node.js + Express.js  
**Database:** MongoDB Atlas  

---

## 1. Localhost Quickstart Guide

### 1.1 Prerequisites
- Node.js (version 20 or higher)
- NPM (version 10 or higher)
- Active MongoDB Atlas cluster with Network Access whitelisting (`0.0.0.0/0` or current IP)

### 1.2 Environment Configuration
Create or verify `INKLOOMAI/backend/.env`:
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Atlas URI (replace with real cluster credentials)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.zox2c.mongodb.net/inkloom?retryWrites=true&w=majority

# JWT signing secret (minimum 32 characters)
JWT_SECRET=inkloom_ai_jwt_production_secret_key_2025_secure_tokens

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 1.3 Starting the Backend
```bash
cd "INKLOOMAI/backend"
npm install
npm start
```

Expected terminal startup output:
```
Connected to MongoDB
Inkloom backend running on http://localhost:4000
```

### 1.4 Verifying the Health Endpoint
In PowerShell or terminal:
```bash
curl http://localhost:4000/api/health
```
Expected Response (`200 OK`):
```json
{
  "status": "ok",
  "database": "connected",
  "service": "inkloom-backend",
  "timestamp": "2026-11-22T06:08:40.744Z"
}
```

---

## 2. Resolving "Database unavailable. Configure MONGODB_URI before using the API."

If this banner appears on the frontend registration or login page:

### Why this occurs:
The backend's connection gate in `server.js` checks for `process.env.MONGODB_URI`. If this variable is `undefined` or empty, the server returns HTTP 503:
```json
{ "error": "Database unavailable. Configure MONGODB_URI before using the API." }
```

### Resolution Steps:
1. **For Vercel Production Deployments:**
   - Go to your **Vercel Dashboard** -> Select the **INKLOOM AI** project (or Backend service project).
   - Navigate to **Settings** -> **Environment Variables**.
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`).
     - `JWT_SECRET`: A secure string with at least 32 characters.
     - `GEMINI_API_KEY`: Your Google Gemini API Key.
     - `NODE_ENV`: `production`
   - In **MongoDB Atlas** -> **Network Access**:
     - Ensure `0.0.0.0/0` (Allow Access from Anywhere) is added. Vercel functions execute on dynamic IP addresses, so static IP whitelisting will block connections.
   - Trigger a **Redeploy** on Vercel so the environment variables take effect.

2. **For Local Development:**
   - Verify that `INKLOOMAI/backend/.env` exists and contains a non-empty `MONGODB_URI`.
   - Ensure strings with special characters in passwords are URI-encoded.

---

## 3. End-to-End Core Business Workflow Verification

The 15-step core business workflow is fully implemented and automated in `test/apiWorkflowAndReviews.test.js`:

| Step | Workflow Action | Endpoint / Method | Verification Status |
|---|---|---|---|
| **1** | Brand Admin Registration & Login | `POST /api/auth/register`, `POST /api/auth/login` | Verified (`201` & `200`) |
| **2** | Create & Update Brand DNA | `PUT /api/auth/me` | Verified Brand voice, pillars, guidelines saved |
| **3** | Create Campaign with Brief & Deadlines | `POST /api/campaigns` | Verified Campaign created with channels & budget |
| **4** | Assign Freelancer to Campaign | `POST /api/assignments` | Verified Assignment created; duplicate assignment blocked |
| **5** | Freelancer Login & Assigned Campaigns Retrieval | `GET /api/assignments` | Verified Freelancer only views their assigned work |
| **6** | Freelancer Accepts Assignment | `PUT /api/assignments/:id/status` | Verified Status transitions to `accepted` |
| **7** | Freelancer Creates & Saves Content Draft | `POST /api/submissions` | Verified Draft saved with char, word, reading time metrics |
| **8** | Freelancer Submits Content for Review | `PUT /api/submissions/:id/submit` | Verified Status transitions to `Submitted for Brand Approval` |
| **9** | Brand Admin Retrieves Submission | `GET /api/submissions/:id` | Verified Brand retrieves complete draft and metadata |
| **10** | Gemini AI Compliance Analysis | `POST /api/reviews` | Verified Analyzes content against brand brief & voice |
| **11** | AI Inspection Findings Generated | `Review.findings` | Verified Generates audit score, integrity score, risk alerts |
| **12** | Brand Admin Requests Revision | `PUT /api/submissions/:id/revision-requested`| Verified Inserts formal `Revision` record (`status: open`) |
| **13** | Freelancer Updates & Resubmits Content | `PUT /api/submissions/:id/resubmit` | Verified Version bumped to `1.1`, revision status `resubmitted` |
| **14** | Brand Admin Approves Resubmission | `PUT /api/reviews/:id/decision` | Verified Deliberate Brand approval action (`decision: approved`) |
| **15** | Dashboards Retrieve Synchronized Status | `GET /api/submissions/:id` | Verified Both Brand & Freelancer read `Approved` from Atlas |

---

## 4. Test Suite Execution

To execute the entire 58-test test suite:
```bash
cd "INKLOOMAI/backend"
npm test
```

Expected result:
```
✔ GET /api/health returns 200 and database connected
✔ POST /api/auth/register creates a Brand Admin successfully
✔ POST /api/auth/register creates a Freelancer successfully
✔ POST /api/auth/login succeeds with valid credentials
...
✔ test\testHelper.js
ℹ tests 58
ℹ suites 0
ℹ pass 58
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 8326.6719
```
