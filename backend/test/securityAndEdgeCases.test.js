const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Assignment = require("../models/Assignment");

const testRunId = Date.now();
const brandAEmail = `sec_branda_${testRunId}@example.com`;
const brandBEmail = `sec_brandb_${testRunId}@example.com`;
const freeAEmail = `sec_freea_${testRunId}@example.com`;
const freeBEmail = `sec_freeb_${testRunId}@example.com`;

let brandACookie = "";
let brandBCookie = "";
let freeACookie = "";
let freeBCookie = "";
let brandACampaignId = "";
let freeAAssignmentId = "";

test.before(async () => {
  await startTestServer();

  // Create Brand A
  const ba = await request({
    method: "POST",
    path: "/api/auth/register",
    body: { fullName: "Brand A Admin", email: brandAEmail, password: "Password123!", role: "brand" },
  });
  brandACookie = ba.cookie;

  // Create Brand B
  const bb = await request({
    method: "POST",
    path: "/api/auth/register",
    body: { fullName: "Brand B Admin", email: brandBEmail, password: "Password123!", role: "brand" },
  });
  brandBCookie = bb.cookie;

  // Create Freelancer A
  const fa = await request({
    method: "POST",
    path: "/api/auth/register",
    body: { fullName: "Freelancer A", email: freeAEmail, password: "Password123!", role: "freelancer" },
  });
  freeACookie = fa.cookie;

  // Create Freelancer B
  const fb = await request({
    method: "POST",
    path: "/api/auth/register",
    body: { fullName: "Freelancer B", email: freeBEmail, password: "Password123!", role: "freelancer" },
  });
  freeBCookie = fb.cookie;

  // Brand A creates Campaign
  const cRes = await request({
    method: "POST",
    path: "/api/campaigns",
    cookie: brandACookie,
    body: {
      name: "Brand A Private Campaign",
      objective: "Confidential launch",
      date: new Date().toISOString(),
    },
  });
  brandACampaignId = cRes.body.campaign.id;

  // Brand A assigns Freelancer A
  const aRes = await request({
    method: "POST",
    path: "/api/assignments",
    cookie: brandACookie,
    body: {
      campaignId: brandACampaignId,
      freelancerId: fa.body.user.id,
    },
  });
  freeAAssignmentId = aRes.body.assignment.id;
});

test.after(async () => {
  if (brandACampaignId) {
    await Assignment.deleteMany({ campaignId: brandACampaignId });
    await Campaign.deleteOne({ _id: brandACampaignId });
  }
  await User.deleteMany({ email: { $in: [brandAEmail, brandBEmail, freeAEmail, freeBEmail] } });
  await stopTestServer();
});

test("Security Headers: server sets strong defense headers", async () => {
  const res = await request({ method: "GET", path: "/api/health" });
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.equal(res.headers["x-frame-options"], "DENY");
  assert.equal(res.headers["x-xss-protection"], "1; mode=block");
  assert.equal(res.headers["referrer-policy"], "strict-origin-when-cross-origin");
  assert.equal(res.headers["cross-origin-opener-policy"], "same-origin");
  assert.equal(res.headers["x-powered-by"], undefined); // disabled
});

test("Security: Large payloads exceeding 100kb are rejected with 413", async () => {
  const hugePayload = "x".repeat(110 * 1024); // 110kb
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: JSON.stringify({ huge: hugePayload }),
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(res.status, 413);
  assert.match(res.body.error, /too large/i);
});

test("Security: Malformed JSON request body returns 400", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: "{ malformed json...",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Invalid JSON request/i);
});

test("Security: NoSQL Injection attempt in login is rejected", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: { $gt: "" }, // attempted query operator injection
      password: "Password123!",
    },
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Email and password are required/i);
});

test("IDOR Defense: Brand B cannot view Brand A's private campaign", async () => {
  const res = await request({
    method: "GET",
    path: `/api/campaigns/${brandACampaignId}`,
    cookie: brandBCookie,
  });
  assert.equal(res.status, 404);
  assert.match(res.body.error, /Campaign not found/i);
});

test("IDOR Defense: Brand B cannot update Brand A's private campaign", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/campaigns/${brandACampaignId}`,
    cookie: brandBCookie,
    body: { name: "Hacked by Brand B" },
  });
  assert.equal(res.status, 404);
});

test("IDOR Defense: Brand B cannot delete Brand A's campaign", async () => {
  const res = await request({
    method: "DELETE",
    path: `/api/campaigns/${brandACampaignId}`,
    cookie: brandBCookie,
  });
  assert.equal(res.status, 404);
});

test("IDOR Defense: Freelancer B cannot view Freelancer A's assignment", async () => {
  const res = await request({
    method: "GET",
    path: `/api/assignments/${freeAAssignmentId}`,
    cookie: freeBCookie,
  });
  assert.equal(res.status, 404);
  assert.match(res.body.error, /Assignment not found/i);
});

test("IDOR Defense: Freelancer B cannot accept Freelancer A's assignment", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/assignments/${freeAAssignmentId}/status`,
    cookie: freeBCookie,
    body: { status: "accepted" },
  });
  assert.equal(res.status, 404);
});

test("Authentication: Tampered JWT token signature is rejected with 401", async () => {
  const validTokenMatch = brandACookie.match(/token=([^;]+)/);
  assert.ok(validTokenMatch);
  const tamperedCookie = `token=${validTokenMatch[1]}tampered_signature`;

  const res = await request({
    method: "GET",
    path: "/api/auth/me",
    cookie: tamperedCookie,
  });
  assert.equal(res.status, 401);
  assert.match(res.body.error, /Invalid or expired token/i);
});
