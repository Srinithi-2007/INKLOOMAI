# INKLOOM AI — BRAND DNA SETTINGS REPORT

**Feature:** Brand DNA & Governance Guardrails (Phase 2 Feature 1)  
**Author:** Senior Full-Stack Software Architect & AI Integration Specialist  
**Status:** COMPLETE & VERIFIED (Zero Regressions)

---

## 1. Overview & Business Objectives

Brand DNA is the core intelligence layer of INKLOOM AI. In enterprise marketing workflows, human and creator submissions frequently drift in tone, cite unverified claims, or inadvertently use banned terms or competitive trademarks. 

The Brand DNA feature allows Brand Admins to define their sovereign brand identity once, persist it securely in MongoDB, and have it automatically enforced across all campaigns, creator assignments, and live Gemini AI compliance reviews.

---

## 2. Data Model Architecture

The `User` model (`backend/models/User.js`) was extended with additive, backward-compatible fields:

```javascript
// Extended UserSchema (additive, backward-compatible)
brandVoice: { type: String, default: "" },
corePillars: [{ type: String, trim: true }],
preferredTerms: [{ type: String, trim: true }],
bannedTerms: [{ type: String, trim: true }],
approvedClaims: [{ type: String, trim: true }],
visualGuidelines: { type: String, default: "" },
platformRules: {
  linkedin: { type: String, default: "" },
  twitter: { type: String, default: "" },
  instagram: { type: String, default: "" },
  youtube: { type: String, default: "" },
},
additionalRules: [{ type: String, trim: true }],
```

### Sanitization & Serialization
The `toPublicJSON()` instance method was updated to safely expose Brand DNA attributes to authenticated clients while strictly omitting sensitive password hashes and internal database properties.

---

## 3. Backend REST APIs

### 3.1. GET `/api/brand/dna`
- **Access Control:** Requires `authMiddleware` and `requireRole("brand")`. Freelancer requests are rejected with `403 Forbidden`. Unauthenticated requests return `401 Unauthorized`.
- **Response Payload:** Returns `{ success: true, brandDna: { ... } }` containing voice, pillars, guardrails, and platform rules.

### 3.2. PUT `/api/brand/dna`
- **Access Control:** Strictly restricted to authenticated Brand Admins.
- **Validation:**
  - Length bounds on voice and visual guidelines.
  - Array type validation for string lists (`bannedTerms`, `preferredTerms`, `approvedClaims`, `corePillars`).
  - Strict sanitization of nested platform rule dictionaries.
  - Role privilege escalation defense: attempts to alter `role`, `email`, or `password` are discarded.
- **Persistence:** Persisted atomically via `user.save()`.

---

## 4. Live Gemini Compliance AI Injection

In `backend/routes/reviews.js`, when a creator submission enters compliance analysis (`POST /api/reviews/ai-review`), the backend queries the Brand Admin user record via `User.findById(submission.brandId)` and dynamically constructs the guideline context:

```javascript
const dnaSections = [];
if (brandUser?.brandVoice) dnaSections.push(`Brand Voice / Tone: ${brandUser.brandVoice}`);
if (brandUser?.corePillars?.length) dnaSections.push(`Core Pillars: ${brandUser.corePillars.join(", ")}`);
if (brandUser?.preferredTerms?.length) dnaSections.push(`Preferred Terminology: ${brandUser.preferredTerms.join(", ")}`);
if (brandUser?.bannedTerms?.length) dnaSections.push(`BANNED Phrases (Strict Prohibitions): ${brandUser.bannedTerms.join(", ")}`);
if (brandUser?.approvedClaims?.length) dnaSections.push(`Approved Claims: ${brandUser.approvedClaims.join("; ")}`);
if (brandUser?.visualGuidelines) dnaSections.push(`Visual & Formatting Rules: ${brandUser.visualGuidelines}`);
```

This context is injected into the compliance prompt evaluated by `gemini-3.8-flash`. If a creator uses a banned phrase or makes an unverified claim, the AI explicitly flags it in `findings` with high severity and suggests an approved alternative.

---

## 5. Frontend User Experience

- **Page Path:** `/brand/dna` (linked directly in Brand Layout navigation and Brand Overview Quick Actions).
- **Design System:** Sovereign Violet palette, frosted card containers, pill tag management, and clean platform tab selectors.
- **Interactive Capabilities:**
  - Dynamic pill addition and removal for banned terms, preferred terms, core pillars, and claims with keyboard Enter support.
  - Platform-specific guideline editors for LinkedIn, Twitter/X, Instagram, and YouTube.
  - Floating sticky action bar indicating unsaved changes with instant Save and Reset controls.

---

## 6. Automated Test Verification

All 6 automated integration tests in `backend/test/brandDna.test.js` pass with 100% reliability:
1. `GET /api/brand/dna` rejects unauthenticated request with 401.
2. `GET /api/brand/dna` forbids Freelancer with 403.
3. `GET /api/brand/dna` returns initial brand DNA for Brand Admin.
4. `PUT /api/brand/dna` forbids Freelancers from modifying brand DNA.
5. `PUT /api/brand/dna` updates and persists all Brand DNA parameters.
6. `GET /api/brand/dna` confirms cross-session persistence across server restarts.
