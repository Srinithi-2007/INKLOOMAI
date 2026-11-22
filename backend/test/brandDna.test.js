const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");

const testRunId = Date.now();
const brandEmail = `brand_dna_${testRunId}@example.com`;
const freelancerEmail = `free_dna_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";

test.before(async () => {
  await startTestServer();

  const bRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Brand DNA Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      brandName: "Acme Enterprise",
    },
  });
  brandCookie = bRes.cookie;

  const fRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Freelancer Creator",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
    },
  });
  freelancerCookie = fRes.cookie;
});

test.after(async () => {
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  await stopTestServer();
});

test("GET /api/brand/dna rejects unauthenticated request with 401", async () => {
  const res = await request({
    method: "GET",
    path: "/api/brand/dna",
  });
  assert.equal(res.status, 401);
});

test("GET /api/brand/dna forbids Freelancer with 403", async () => {
  const res = await request({
    method: "GET",
    path: "/api/brand/dna",
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Role brand required/i);
});

test("GET /api/brand/dna returns initial brand DNA for Brand Admin", async () => {
  const res = await request({
    method: "GET",
    path: "/api/brand/dna",
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.brandDna.brandName, "Acme Enterprise");
  assert.ok(Array.isArray(res.body.brandDna.corePillars));
});

test("PUT /api/brand/dna forbids Freelancers from modifying brand DNA", async () => {
  const res = await request({
    method: "PUT",
    path: "/api/brand/dna",
    cookie: freelancerCookie,
    body: {
      brandVoice: "Unauthorized voice override",
    },
  });
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Role brand required/i);
});

test("PUT /api/brand/dna updates and persists all Brand DNA parameters", async () => {
  const payload = {
    brandName: "Acme Cloud AI",
    orgName: "Acme Corp International",
    brandVoice: "Authoritative, approachable, enterprise-grade, objective",
    corePillars: ["Zero Trust Security", "Verifiable AI Governance", "SOC2 Certified"],
    preferredTerms: ["enterprise-ready", "guardrails", "deterministic"],
    bannedTerms: ["unhackable", "100% guarantee", "magic", "foolproof"],
    approvedClaims: [
      "Inkloom AI automates brand compliance across multi-channel campaigns.",
      "Enterprise audit scores are verified through deterministic rule engines.",
    ],
    visualGuidelines: "Primary color #7C3AED (Sovereign Violet), clean padding, rounded-xl cards.",
    platformRules: {
      LinkedIn: "Include professional hook, 2 hashtags, and certified webinar call-to-action.",
      Twitter: "Concise thread format, under 280 characters per tweet.",
    },
    additionalRules: [
      "Always include regulatory disclaimers on forward-looking statements.",
      "Do not disparage direct competitor products.",
    ],
  };

  const res = await request({
    method: "PUT",
    path: "/api/brand/dna",
    cookie: brandCookie,
    body: payload,
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.brandDna.brandName, "Acme Cloud AI");
  assert.equal(res.body.brandDna.brandVoice, payload.brandVoice);
  assert.deepEqual(res.body.brandDna.corePillars, payload.corePillars);
  assert.deepEqual(res.body.brandDna.bannedTerms, payload.bannedTerms);
  assert.deepEqual(res.body.brandDna.approvedClaims, payload.approvedClaims);
  assert.equal(res.body.brandDna.platformRules.LinkedIn, payload.platformRules.LinkedIn);
});

test("GET /api/brand/dna confirms persistence across sessions", async () => {
  const res = await request({
    method: "GET",
    path: "/api/brand/dna",
    cookie: brandCookie,
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.brandDna.brandName, "Acme Cloud AI");
  assert.ok(res.body.brandDna.bannedTerms.includes("unhackable"));
  assert.ok(res.body.brandDna.approvedClaims.length === 2);
});
