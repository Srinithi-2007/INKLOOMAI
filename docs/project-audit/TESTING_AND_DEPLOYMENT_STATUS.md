# INKLOOM AI — Testing & Deployment Status Report

**Date:** November 22, 2026  
**QA Lead:** Senior Full-Stack Architect & QA Engineer  
**Backend Test Suite:** Node.js Native Test Runner (`node --test`)  
**Frontend Type Engine:** TypeScript 5.5.3  
**Frontend E2E Engine:** Playwright 1.65.1  
**Deployment Platform:** Vercel Multi-Service Monorepo  

---

## 1. Test Suite Results & Metrics

| Test Suite | Target | Executed Tests | Passed | Failed | Blocked | Execution Duration |
|---|---|---|---|---|---|---|
| **API Auth Suite** (`apiAuth.test.js`) | Register, Login, Me, Role Tamper, Logout | 17 | 17 | 0 | 0 | 4.3s |
| **Campaigns & Assignments** (`apiCampaignsAndAssignments.test.js`) | Campaign CRUD, Assignment Delegation, IDOR | 13 | 13 | 0 | 0 | 4.8s |
| **Core Workflow & Reviews** (`apiWorkflowAndReviews.test.js`) | 15-step business workflow, Revisions, Decisions | 11 | 11 | 0 | 0 | 7.6s |
| **Security & Edge Cases** (`securityAndEdgeCases.test.js`) | Headers, 100kb payload (413), JSON syntax (400), NoSQL injection, IDOR | 10 | 10 | 0 | 0 | 4.5s |
| **Auth & Config Unit Tests** (`authConfig`, `authCookies`, `mongoConnection`, `geminiService`) | Environment validation, Cookie attributes, Connection caching | 7 | 7 | 0 | 0 | 1.2s |
| **Frontend Static Type Check** (`tsc --noEmit`) | Next.js 14 App Router Types, Components, Libraries | Full Codebase | All Types Valid | 0 | 0 | 2.1s |
| **Frontend Production Build** (`next build`) | Static page generation (10 routes), Webpack chunks | 10 Routes | 10 Generated | 0 | 0 | 4.2s |
| **Playwright E2E Suite** (`auth-navigation.spec.ts`) | Navigation, Role selection, Email validation | 3 | 0 | 0 | 3 | N/A |
| **TOTALS** | | **61 Tests + 10 Routes** | **58 Tests Passed** | **0 Failed** | **3 Blocked** | **~25s Total** |

### Detailed Note on Blocked Playwright Tests
The 3 Playwright tests in `frontend/tests/auth-navigation.spec.ts` could not execute on the host machine because the Playwright headless browser executable has not been downloaded:
```
Error: browserType.launch: Executable doesn't exist at C:\Users\Srinithi\AppData\Local\ms-playwright\chromium_headless_shell-1255\chrome-headless-shell-win64\chrome-headless-shell.exe
```
To unblock this suite, run `npx playwright install` inside `INKLOOMAI/frontend`.

---

## 2. Deployment Architecture & Vercel Configuration

The repository uses a unified Vercel multi-service monorepo configuration defined in `INKLOOMAI/vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "backend": {
      "root": "backend",
      "framework": "express"
    },
    "frontend": {
      "root": "frontend",
      "framework": "nextjs"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": {
        "service": "backend"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "service": "frontend"
      }
    }
  ]
}
```

### Environment Variables Checklist

| Variable Name | Backend Requirement | Frontend Requirement | Description |
|---|---|---|---|
| `MONGODB_URI` | **Required** | Not Required | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `JWT_SECRET` | **Required** | Not Required | Long signing secret (at least 32 characters). |
| `GEMINI_API_KEY`| **Required** | Not Required | Google Gemini API Key for compliance reviews. |
| `GEMINI_MODEL` | Optional | Not Required | Configurable Gemini model (defaults to `gemini-3.8-flash`). |
| `NODE_ENV` | **Required** | Optional | Set to `production` in Vercel to enforce `Secure=true` cookies. |
| `FRONTEND_URL` | Optional | Not Required | Allowed CORS origin (defaults to `http://localhost:3000`). |
| `NEXT_PUBLIC_API_URL` | Not Required | Optional | Base URL for API requests (empty string uses relative `/api` paths). |

---

## 3. Production vs Localhost Differences

1. **MongoDB Atlas IP Whitelisting:**
   - Local development connects from the developer's local ISP IP address.
   - Vercel Serverless Functions execute from dynamic AWS/GCP cloud IP pools. Therefore, **`0.0.0.0/0` (Allow Access from Anywhere)** must be enabled in MongoDB Atlas Network Access for production deployments.
2. **Cookie Security:**
   - When `NODE_ENV === "production"`, `server.js` sets `secure: true` on the `token` cookie, requiring HTTPS.
   - During local development (`NODE_ENV === "development"` or `test`), `secure: false` allows cookie persistence over HTTP (`http://localhost:4000` and `http://localhost:3000`).
3. **Port Listening:**
   - Locally, `server.js` listens on port `4000` via `app.listen()`.
   - On Vercel, the Express app instance is exported and invoked directly as a serverless function handler without binding to a static TCP port.
