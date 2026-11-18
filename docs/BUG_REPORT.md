# Bug Report

## Fixed

| ID | Severity | Defect | Repair |
|---|---|---|---|
| FIX-01 | Critical | ESM `.mjs` configuration used `module.exports`, preventing Next from starting. | Changed both config files to ESM default exports. |
| FIX-02 | High | `focus-visible:ring-primary/40` and other primary utilities were undefined in Tailwind. | Added the existing Sovereign Violet value as the `primary` theme alias. |
| FIX-03 | High | Duplicate Tailwind color keys generated TypeScript diagnostics. | Removed redundant keys without changing colors. |
| FIX-04 | Critical | Freelancer page JSX was truncated; Brand Reviews had an unclosed `div`. | Restored compilable route structure and implemented the dashboard/review UI. |
| FIX-05 | High | Auth form email regex rejected common valid email addresses; registration rendered duplicate email/password inputs. | Corrected the regex and made sign-in fields conditional. |
| FIX-06 | High | Auth, Brand Overview, and Header had broken API wiring/missing imports. | Wired auth to backend endpoints and corrected imports/types. |
| FIX-07 | High | Frontend authentication used seeded users, plaintext passwords in session storage, and fabricated OTP/reset flows. | Replaced it with backend API auth and HttpOnly cookie sessions; removed the simulated verification path. |
| FIX-08 | Critical | Gemini failures produced a success-shaped fallback with fabricated scores/findings and an AI `approved` decision. | Removed fallback, validate model output, fail with explicit configuration/service errors, and force all AI analysis to remain pending. |
| FIX-09 | High | Some campaign and workflow endpoints returned or modified records without consistent owner/role checks. | Added scoped reads/writes, validation, transition checks, and explicit role failures in the relevant routes. |
| FIX-10 | High | API responses did not consistently expose the frontend's `id` contract. | Added safe public user serialization and JSON `id` transforms to workflow models. |
| FIX-11 | High | Freelancer resubmission referenced `Revision` without importing it, producing HTTP 500. | Added the model import and verified resubmission against MongoDB. |
| FIX-12 | High | AI analysis and brand decisions wrote related review/submission/assignment records sequentially, risking partial status changes. | Wrapped AI-analysis state changes and brand decisions/revision creation in MongoDB transactions; verified decision state synchronization against Atlas. |
| FIX-13 | Medium | Brand freelancer-list responses omitted the `id` expected by assignment UI, causing a React key warning and invalid selection state. | Serialize through `toPublicJSON`; verified `id` is present and password is excluded. |

## Open / blocked

| ID | Severity | Defect or risk | Status |
|---|---|---|---|
| OPEN-01 | High | Mongo-backed workflow has not been integration-tested end to end. | Atlas connectivity is confirmed (health HTTP 200); execute persistence and workflow tests. |
| OPEN-02 | Blocker | Gemini inference currently returns HTTP 503 due to provider high demand; the key is accepted for model discovery. | Retry real analysis when the provider recovers; no response is fabricated or persisted. |
| OPEN-03 | High | Password reset and email verification/delivery are not implemented. | Not represented as functional; UI discloses missing email verification. |
| OPEN-04 | High | Full repeatable API/E2E tests for cross-brand isolation and a real Gemini-to-review flow are not yet in the suite. | One-off Atlas smoke tests verified core persistence and review transitions; add repeatable tests and run with Gemini configured. |
| OPEN-05 | Medium | Campaign assignment and submission save/submit/resubmit still update related documents sequentially. | Extend transaction coverage and test consistency under failures/concurrency before demo sign-off. |
| OPEN-06 | Medium | Rate limiting, session revocation/rotation, and account recovery hardening are not implemented. | Production hardening pending. |
| OPEN-07 | Medium | Standalone Brand DNA, invitations, and profile-management screens are not available in the unified app. | Feature parity pending. |

