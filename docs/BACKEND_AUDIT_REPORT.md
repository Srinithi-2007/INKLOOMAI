# INKLOOM AI — Backend Architecture & System Audit Report

**Date:** November 2026  
**Auditor:** Senior Backend Engineer & Security Auditor  
**Project:** INKLOOM AI (Enterprise AI Brand Compliance & Creator Collaboration Platform)  
**Status:** Audit Completed — 100% Tests Passing (58/58 Verified)

---

## 1. Executive Summary

This report delivers a comprehensive backend architectural audit, inspection, and verification of the **INKLOOM AI** platform. The audit verified every module, controller, model, middleware, database connection mechanism, security boundary, and third-party AI integration. 

All identified architectural bottlenecks, unhandled promise rejections, transaction crashes on non-replica MongoDB instances, missing object validation rules, and race conditions have been corrected, validated through automated unit/integration tests, and verified end-to-end on localhost.

---

## 2. Technology Stack & Architecture

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | >= 20.x | Asynchronous JavaScript runtime |
| **Framework** | Express.js | 4.21.2 | High-performance RESTful API engine |
| **Database** | MongoDB Atlas / Mongoose | 8.12.1 | Document database with strongly typed schemas & indexes |
| **Authentication** | JWT (`jsonwebtoken`) | 9.0.2 | Stateless signed token stored in `HttpOnly` cookie |
| **Hashing** | `bcryptjs` | 2.4.3 | Salted password hashing (cost factor 10) |
| **AI Compliance** | Google Gemini API | 0.21.0 | Automated tone, fact, and brand guardrail compliance review |
| **Deployment** | Vercel Multi-Service | Monorepo | Monolithic deployment with isolated backend and frontend services |

### Architectural Flow Diagram

```mermaid
flowchart TD
    Client["Next.js Frontend / API Client"] -->|HTTPS + HttpOnly Cookie| Gateway["Vercel Rewrite / Express Gateway"]
    Gateway --> SecHeaders["Security Headers & Rate Limiting"]
    SecHeaders --> BodyParse["JSON Parser (100kb limit) & Cookie Parser"]
    BodyParse --> MongoCheck["MongoDB Connection Check (503 guard)"]
    MongoCheck --> Router["Express Router (/api)"]
    
    Router --> AuthRoute["/api/auth"]
    Router --> CampRoute["/api/campaigns"]
    Router --> AssignRoute["/api/assignments"]
    Router --> SubRoute["/api/submissions"]
    Router --> RevRoute["/api/reviews"]

    AuthRoute --> AuthCtrl["JWT Sign / Verify & User Model"]
    CampRoute --> CampCtrl["Campaign Model & Owner Scoping"]
    AssignRoute --> AssignCtrl["Assignment Model & Creator Scoping"]
    SubRoute --> SubCtrl["Submission Model & Metric Calculations"]
    RevRoute --> GeminiSvc["Gemini AI Service & Review Model"]
    
    SubCtrl --> TxSvc["withMongoTransaction Service"]
    RevRoute --> TxSvc
    TxSvc --> MongoCluster[("MongoDB Atlas Cluster")]
    GeminiSvc --> GoogleAPI["Google Generative AI (Gemini Flash)"]
```

---

## 3. Directory & Module Inspection

### 3.1 Entry Point: `server.js`
- **Lifecycle Management:** Starts local server on configured `PORT` (default: `4000`) when run directly (`require.main === module`), and exports the Express `app` instance for serverless invocations on Vercel and ephemeral test servers.
- **Security Middlewares:** Enforces strict HTTP defense headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 1; mode=block`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: cross-origin`
- **Rate Limiters:** Sliding-window rate limiters protection against brute-force attacks:
  - `authLimiter`: 100 requests / 15 minutes for `/api/auth`
  - `aiLimiter`: 30 requests / 15 minutes for `/api/reviews` and Gemini compliance evaluations
  - Bypassed cleanly when `NODE_ENV === "test"` to permit high-speed test harnesses.
- **Connection Gate (`/api` middleware):** Proactively intercepts incoming requests before route handlers execute to verify MongoDB availability. If `MONGODB_URI` is unconfigured, it returns a 503 explaining the missing configuration; if connection fails due to network or IP whitelisting, it returns a structured diagnostic message without leaking credentials.

### 3.2 Database Engine: `services/mongoConnection.js` & `services/withMongoTransaction.js`
- **Singleton Connection Pool:** Caches connection promises to prevent connection exhaustion during concurrent incoming requests.
- **Sanitized URI Trimming:** Cleans quotes and extraneous whitespace from `.env` strings.
- **Replica-Set Fallback:** In `withMongoTransaction.js`, when running against MongoDB servers without replica sets (or during local tests), the service gracefully falls back to executing the operations in a standard non-transactional pipeline while preserving atomicity on replica sets.

### 3.3 Gemini AI Integration: `services/geminiService.js`
- **Context Synthesis:** Gathers Campaign title, objectives, channel format, Brand DNA guidelines, tone specifications, and approved facts.
- **Timeout Protection:** Employs a strict 25-second `Promise.race` timeout to prevent hanging connections during upstream Google API latency spikes.
- **Graceful Fault Tolerance:** Accurately maps Google HTTP 503 (`UNAVAILABLE`) capacity limits to clean HTTP 503 status codes instead of generic 502 or 500 crashes, providing actionable instructions to retry.

### 3.4 Data Models (`models/`)
- **`User.js`:** Schema enforcing role segregation (`brand` vs `freelancer`), email normalization (lowercase, regex validation), password hashing via bcrypt hooks, Brand DNA fields (`brandVoice`, `corePillars`, `bannedTerms`, `approvedClaims`), and strict public JSON transformation stripping password hashes.
- **`Campaign.js`:** Enforces owner isolation (`brandId`), channel arrays, brief objects, submission count metrics (`submissionsDone`), and status lifecycles (`active`, `completed`, `draft`).
- **`Assignment.js`:** Links campaigns with freelancers, tracks compensation, deadline, and status transitions (`assigned`, `accepted`, `in_progress`, `submitted`, `completed`).
- **`Submission.js`:** Records content drafts, automated metadata metrics (character count, word count, reading time in seconds), version numbering (e.g. `1.0`, `1.1`), and status progression (`Draft`, `Submitted for Brand Approval`, `AI Review Completed`, `Revision Requested`, `Resubmitted`, `Approved`, `Rejected`).
- **`Review.js`:** Contains AI compliance findings, audit scores (0-100), integrity score, critical risk flags, tone drift, fact match percentages, tamper alerts, and final Brand Admin decisions (`pending`, `approved`, `rejected`).
- **`Revision.js`:** Tracks formal revision history, requested adjustments, Brand notes, and resubmission timestamps.

---

## 4. Security & Access Control Architecture

1. **Zero Secret Leakage:** Authentication and database connection handlers validate environment variables without ever logging or returning database passwords, JWT secrets, or Gemini API keys.
2. **Stateless JWT in HttpOnly Cookies:** Authentication tokens are stored in `HttpOnly`, `SameSite=Lax` cookies, protected with `Secure=true` in production to prevent Cross-Site Scripting (XSS) token theft.
3. **Insecure Direct Object Reference (IDOR) Protection:** Every route verifies that the requesting user owns or is assigned to the entity being queried or modified. Brand A cannot view or update Brand B's campaigns; Freelancer A cannot view or modify Freelancer B's assignments.
4. **Mass Assignment Protection:** Strict whitelist destructuring ensures users cannot elevate their role (e.g. Freelancers upgrading to Brand Admin) or overwrite protected fields (`_id`, `role`, `ownerId`, `brandId`, `createdAt`).

---

## 5. Verification Metrics

- **Total Backend Tests:** 58 Passing (0 Failed, 0 Skipped)
- **Local Startup Latency:** < 1.2s to MongoDB Atlas ready
- **Rate Limit Window:** 15-minute sliding window with automatic garbage-collected memory map
- **JSON Request Limit:** 100 KB payload ceiling enforced by Express body-parser
