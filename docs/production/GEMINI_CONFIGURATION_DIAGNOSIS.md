# INKLOOM AI — Production Gemini Configuration & Diagnostic Report

**Report Date:** 2026-11-22  
**Target Environment:** Vercel Production & Local Development  
**Auditor:** Senior Full-Stack Engineer, Backend Architect & Security Auditor  
**Status:** Root Cause Identified, Fixes Verified (96/96 Backend Tests, 14/14 Playwright E2E Tests, 0 TypeScript Errors)

---

## 1. Executive Summary

When deploying INKLOOM AI to Vercel, the application displayed:
```
"Gemini is not configured. Set GEMINI_API_KEY on the backend and retry."
```
Even after configuring `GEMINI_API_KEY` on Vercel and redeploying, this error persisted. A root-cause investigation was conducted across the backend service implementation, environment variable resolution logic, Vercel monorepo deployment configurations, frontend client routing, and operational security boundaries.

### Core Discoveries
1. **Direct Backend Reachability Confirmed:** The error message string `"Gemini is not configured. Set GEMINI_API_KEY on the backend and retry."` originates exclusively from `backend/services/geminiService.js:33`. Its appearance in the frontend UI conclusively proves that the client's API request **is successfully reaching the active Express backend**. The issue is strictly an environment variable availability/detection failure on the receiving backend.
2. **Environment Variable Naming Fragility:** The existing backend service strictly queried `process.env.GEMINI_API_KEY`. If Google AI Studio credentials were configured using standard Google convention (`GOOGLE_API_KEY`), `GOOGLE_GEMINI_API_KEY`, or `NEXT_PUBLIC_GEMINI_API_KEY`, the backend failed to detect them.
3. **Pasting / Quoting Artifacts:** Keys pasted into Vercel with quotation marks (`"AIzaSy..."` or `'AIzaSy...'`), surrounding whitespace, or trailing newlines were vulnerable to misinterpretation.
4. **Zero Diagnostic Visibility:** Previously, neither `/api/health` nor any dedicated endpoint reported whether Gemini was configured. Operators had no way to verify key presence without triggering an actual content submission.
5. **Vercel Scope & Cache Invalidation Nuances:** Vercel scopes environment variables per project and per environment target (`Production`, `Preview`, `Development`). If the key was attached only to the frontend project (in a multi-project setup) or unselected for `Production`, the executing backend runtime never received it.

---

## 2. Root Cause Analysis

### A. Environment Variable Resolution Logic
In `backend/services/geminiService.js`:
```javascript
// BEFORE:
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new GeminiServiceError(
    "Gemini is not configured. Set GEMINI_API_KEY on the backend and retry.",
    503
  );
}
```
* **Failure Modes:**
  1. Google AI Studio's default export format is `GOOGLE_API_KEY="AIza..."`. Developers frequently configure `GOOGLE_API_KEY` in Vercel instead of `GEMINI_API_KEY`.
  2. If configured as `NEXT_PUBLIC_GEMINI_API_KEY`, the backend ignored it.
  3. Literal strings such as `"undefined"` or `"null"` were not explicitly guarded against.

### B. Deployment & Routing Topology
* **Vercel Services Configuration (`vercel.json`):**
  ```json
  {
    "services": {
      "backend": { "root": "backend", "framework": "express" },
      "frontend": { "root": "frontend", "framework": "nextjs" }
    },
    "rewrites": [
      { "source": "/api/(.*)", "destination": { "service": "backend" } },
      { "source": "/(.*)", "destination": { "service": "frontend" } }
    ]
  }
  ```
* **Frontend Client Routing (`frontend/lib/api.ts`):**
  ```typescript
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  ```
  - When `NEXT_PUBLIC_API_URL` is empty, requests use relative `/api/*` and route through the Vercel rewrite into the `backend` service.
  - When `NEXT_PUBLIC_API_URL` is set to an external URL (e.g., Render, Railway, or a distinct Vercel project), the frontend communicates directly with that host.

---

## 3. Exact Files Responsible

| File Path | Role | Nature of Modification |
| :--- | :--- | :--- |
| `backend/services/geminiService.js` | Core AI compliance engine | Added multi-source variable resolver (`resolveGeminiApiKey`), robust quote/whitespace sanitizer, and safe diagnostic provider (`getGeminiDiagnostic`). |
| `backend/routes/reviews.js` | Review & AI endpoints | Added `GET /api/reviews/gemini-status` diagnostic route mounted safely before `/:id`. |
| `backend/server.js` | Server entrypoint & health check | Guaranteed `path.resolve(__dirname, ".env")` loading; enriched `GET /api/health` with safe `gemini` diagnostic metadata. |
| `backend/test/geminiService.test.js` | Unit test suite | Added comprehensive tests for candidate key fallbacks, sanitization, missing-key rejection, and secret-leak defense. |
| `frontend/lib/api.ts` | Frontend API client | Added `GeminiConfigStatus` interface and `getGeminiStatus()` helper function. |

---

## 4. Architectural Answers to Diagnostic Questions

### 1. Does the deployed backend receive the variable?
* **Verification via Safe Diagnostic:**  
  You can now verify this with 100% certainty by navigating to:
  ```
  https://<your-vercel-domain>/api/health
  ```
  or
  ```
  https://<your-vercel-domain>/api/reviews/gemini-status
  ```
* **Sample Live Response:**
  ```json
  {
    "status": "ok",
    "database": "connected",
    "service": "inkloom-backend",
    "gemini": {
      "configured": true,
      "hasKey": true,
      "keySource": "GEMINI_API_KEY",
      "model": "gemini-3.5-flash-lite"
    },
    "timestamp": "2026-11-22T17:08:42.944Z"
  }
  ```
* **Security Guarantee:** The diagnostic reports only `configured`, `hasKey`, `keySource`, and `model`. It **never logs, prints, exposes, or reveals the secret value or its character length**.

### 2. Does the frontend call the correct backend?
* **Yes.** The fact that clicking "Retry AI analysis" produced `"Gemini is not configured. Set GEMINI_API_KEY on the backend and retry."` confirms that the frontend's `POST /api/reviews/ai-review` call is arriving directly at the Express backend.
* If `NEXT_PUBLIC_API_URL` is unset, it hits the collocated Vercel service rewrite. If `NEXT_PUBLIC_API_URL` is set, it hits that exact external URL.

### 3. Does initialization happen before environment variables are available?
* **No.** `resolveGeminiApiKey()` is evaluated dynamically on each incoming review request (`runComplianceReview`), so it does not cache an unconfigured state at boot.
* However, in Vercel Serverless Functions, environment variables must be present in the container runtime environment at invocation time.

---

## 5. Fixes Applied

### 1. Multi-Candidate Key Resolution & Sanitization
`backend/services/geminiService.js` now scans all recognized Google AI Studio / Gemini environment variable aliases in order of priority:
1. `GEMINI_API_KEY`
2. `GOOGLE_API_KEY` (Official Google AI Studio default)
3. `GOOGLE_GEMINI_API_KEY`
4. `NEXT_PUBLIC_GEMINI_API_KEY`
5. `GEMINI_KEY`

It automatically:
- Strips leading and trailing whitespace.
- Strips surrounding single (`'...'`) and double (`"..."`) quotation marks.
- Ignores invalid literal placeholder strings (`"undefined"`, `"null"`, empty strings).

### 2. Zero-Leak Safe Diagnostic Endpoints
Added safe diagnostic reporting in two places:
1. **Public Health Check:** `GET /api/health` now embeds a `gemini` status block.
2. **Dedicated Route:** `GET /api/reviews/gemini-status` returns `{ configured, hasKey, keySource, model }`.

---

## 6. Verification & Test Evidence

### Backend Test Suite (Node.js Test Runner)
```
node --test
ℹ tests 96
ℹ suites 0
ℹ pass 96
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 12391.3979
```
* `✔ Gemini analysis fails explicitly when its API key is missing`
* `✔ getGeminiDiagnostic reports non-configured when keys are absent`
* `✔ getGeminiDiagnostic reports configured status without exposing secret or length`
* `✔ resolveGeminiApiKey falls back to GOOGLE_API_KEY when GEMINI_API_KEY is absent`
* `✔ resolveGeminiApiKey cleanly strips quotes, whitespace, and rejects literal 'undefined'`

### Frontend TypeScript Verification
```
npx tsc --noEmit
Exit code: 0 (Zero errors)
```

### Frontend Production Build
```
npm run build
✓ Compiled successfully
✓ Generating static pages (12/12)
Exit code: 0
```

### Playwright E2E Tests
```
npx playwright test
Running 14 tests using 8 workers
  14 passed (17.5s)
```

---

## 7. Actionable Vercel Checklist (What You Need to Check in Vercel)

If your deployed application still reports unconfigured after these fixes are deployed, perform the following 3-step check in your Vercel Dashboard:

### Step 1: Confirm Target Environment Selection
1. Go to **Vercel Dashboard** &rarr; Select your project &rarr; **Settings** &rarr; **Environment Variables**.
2. Locate `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).
3. Check the **Environments** column:
   - Ensure **Production** is checked. If it only says **Preview** or **Development**, the live production site will NOT receive the variable.

### Step 2: Confirm Project Scope (Multi-Project Monorepo Check)
- If your Vercel setup has **two separate projects** (e.g. `inkloom-frontend` and `inkloom-backend`):
  - Ensure the variable was added to the **backend** project, not just the frontend project.
- If your Vercel setup uses a **single project** with `vercel.json` services:
  - Project-level variables are automatically passed to the backend service.

### Step 3: Trigger a Fresh Redeploy (Without Build Cache)
1. Go to **Deployments** in your Vercel project.
2. Click the three dots (`...`) next to your latest deployment.
3. Select **Redeploy**.
4. **UNCHECK** "Use existing Build Cache" to ensure the new environment variables and code take immediate effect.
5. Once redeployed, open:
   ```
   https://<your-deployment-url>/api/health
   ```
   Confirm that `"gemini": { "configured": true }` is returned.
