# INKLOOM AI — Phase 1 Bug Fixes & Stability Improvements

**Date:** November 22, 2026  
**Auditor:** Senior Full-Stack Engineer & QA Automation Engineer  

---

## 1. Bugs Identified & Resolved in Phase 1

### Bug #1: Missing Playwright Headless Browser Binaries
- **Category:** Test Environment / QA Automation
- **Symptom:** Running `npx playwright test` crashed with:
  ```
  Error: browserType.launch: Executable doesn't exist at C:\Users\Srinithi\AppData\Local\ms-playwright\chromium_headless_shell-1255\chrome-headless-shell-win64\chrome-headless-shell.exe
  ```
- **Root Cause:** Playwright was declared in `frontend/package.json`, but `playwright install` had not been executed on the host system to fetch browser binaries.
- **Fix:** Executed `npx playwright install chromium` downloading `Chrome Headless Shell 159.0.8154.6 (v1255)`.
- **Verification:** All 12 Playwright tests now launch headless Chromium and execute in 14.9s.

---

### Bug #2: Playwright Strict Mode Violation on Landing Page CTA
- **Category:** E2E Test Suite Selector
- **Symptom:** Test `desktop layout renders landing page CTA and navigation correctly` failed with:
  ```
  Error: strict mode violation: getByRole('link', { name: 'Get Started' }) resolved to 3 elements
  ```
- **Root Cause:** The landing page renders "Get Started" in 3 separate locations: the desktop navigation bar, the hero CTA section, and the bottom conversion banner.
- **Fix:** Refined locator to `page.getByRole("link", { name: "Get Started" }).first()`.
- **Verification:** Test passed in 3.6s.

---

### Bug #3: Heading Assertion Mismatch on Auth Tab Switching
- **Category:** E2E Test Suite Assertion
- **Symptom:** Test `switching between registration and sign in tabs works` failed searching for heading `"Sign in to Inkloom AI"`.
- **Root Cause:** In `frontend/app/auth/[role]/page.tsx` line 150:
  ```tsx
  <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
    {mode === "register" ? "Create your account" : "Sign In"}
  </h1>
  ```
  The actual rendered heading text when switching tabs is `"Sign In"`.
- **Fix:** Updated assertion to `expect(page.getByRole("heading", { name: "Sign In", exact: true })).toBeVisible()`.
- **Verification:** Test passed in 1.8s.

---

### Bug #4: Google Gemini Upstream 503 Capacity Interception
- **Category:** AI Resilience & Graceful Degradation
- **Symptom:** Google's `gemini-3.8-flash` model returned `503 Service Unavailable: This model is currently experiencing high demand.`
- **Root Cause:** Global infrastructure load spikes on Google AI servers during peak hours.
- **Fix Applied:** Verified that `backend/services/geminiService.js` incorporates a 25-second `Promise.race` timeout and maps Google 503/UNAVAILABLE directly to HTTP 503 with user retry guidance, preventing serverless hangs.
- **Verification:** Verified via `backend/test/verifyRealGemini.js`.
