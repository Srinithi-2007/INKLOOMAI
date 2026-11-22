const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");

const testRunId = Date.now();
const brandEmail = `test_brand_${testRunId}@example.com`;
const freelancerEmail = `test_freelancer_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";
let brandUserId = "";
let freelancerUserId = "";

test.before(async () => {
  await startTestServer();
  // Ensure clean slate for test emails
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
});

test.after(async () => {
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  await stopTestServer();
});

test("GET /api/health returns 200 and database connected", async () => {
  const res = await request({ method: "GET", path: "/api/health" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
  assert.equal(res.body.database, "connected");
  assert.equal(res.body.service, "inkloom-backend");
});

test("POST /api/auth/register validates required fields", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: { fullName: "A" }, // too short
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Missing required fields/i);
});

test("POST /api/auth/register validates email format", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Test User",
      email: "invalid-email-format",
      password: "password123",
      role: "brand",
    },
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Missing required fields/i);
});

test("POST /api/auth/register validates password minimum length", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Test User",
      email: "valid@example.com",
      password: "short",
      role: "brand",
    },
  });
  assert.equal(res.status, 400);
});

test("POST /api/auth/register creates a Brand Admin successfully", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Acme Brand Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      orgName: "Acme Corp",
      brandName: "Acme",
      industry: "Technology",
      website: "https://acme.example.com",
      size: "11-50",
      about: "Innovative tech brand",
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.email, brandEmail);
  assert.equal(res.body.user.role, "brand");
  assert.equal(res.body.user.brandName, "Acme");
  assert.ok(res.cookie.includes("token="));
  brandCookie = res.cookie;
  brandUserId = res.body.user.id;
});

test("POST /api/auth/register rejects duplicate email registration with 409", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Another Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
    },
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /already registered/i);
});

test("POST /api/auth/register creates a Freelancer successfully", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Alex Freelancer",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
      specialization: "Copywriting",
      portfolio: "https://alex.example.com",
      bio: "Seasoned brand copywriter",
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.role, "freelancer");
  assert.ok(res.cookie.includes("token="));
  freelancerCookie = res.cookie;
  freelancerUserId = res.body.user.id;
});

test("POST /api/auth/login rejects wrong password with 401", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: brandEmail,
      password: "WrongPassword999!",
    },
  });
  assert.equal(res.status, 401);
  assert.match(res.body.error, /Invalid email or password/i);
});

test("POST /api/auth/login rejects role mismatch with 401", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: brandEmail,
      password: "Password123!",
      role: "freelancer", // brand account logging in as freelancer
    },
  });
  assert.equal(res.status, 401);
});

test("POST /api/auth/login succeeds with valid credentials", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: brandEmail,
      password: "Password123!",
      role: "brand",
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.cookie.includes("token="));
});

test("GET /api/auth/me rejects unauthenticated request with 401", async () => {
  const res = await request({
    method: "GET",
    path: "/api/auth/me",
  });
  assert.equal(res.status, 401);
  assert.match(res.body.error, /Authentication required/i);
});

test("GET /api/auth/me returns current user profile when authenticated", async () => {
  const res = await request({
    method: "GET",
    path: "/api/auth/me",
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, brandEmail);
  assert.equal(res.body.user.role, "brand");
  assert.equal(res.body.user.brandName, "Acme");
  assert.equal(res.body.user.password, undefined); // never exposed
});

test("PUT /api/auth/me updates Brand DNA and brand information", async () => {
  const res = await request({
    method: "PUT",
    path: "/api/auth/me",
    cookie: brandCookie,
    body: {
      brandName: "Acme Global",
      about: "Updated Brand DNA: bold, human, transparent.",
      industry: "AI & SaaS",
      website: "https://acmeglobal.ai",
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.brandName, "Acme Global");
  assert.equal(res.body.user.about, "Updated Brand DNA: bold, human, transparent.");
  assert.equal(res.body.user.industry, "AI & SaaS");
});

test("PUT /api/auth/me prevents privilege escalation (cannot tamper role)", async () => {
  const res = await request({
    method: "PUT",
    path: "/api/auth/me",
    cookie: freelancerCookie,
    body: {
      role: "brand", // privilege escalation attempt
      fullName: "Alex Updated",
      bio: "Updated bio text.",
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, "freelancer"); // role strictly unchanged
  assert.equal(res.body.user.fullName, "Alex Updated");
  assert.equal(res.body.user.bio, "Updated bio text.");
});

test("GET /api/auth/users forbids Freelancers from accessing Brand user list", async () => {
  const res = await request({
    method: "GET",
    path: "/api/auth/users",
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Role brand required/i);
});

test("GET /api/auth/users allows Brand Admin to list Freelancers", async () => {
  const res = await request({
    method: "GET",
    path: "/api/auth/users",
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.users));
  const found = res.body.users.find((u) => u.email === freelancerEmail);
  assert.ok(found, "Registered freelancer must be in the list");
  assert.equal(found.role, "freelancer");
});

test("POST /api/auth/logout clears auth token cookie", async () => {
  const res = await request({
    method: "POST",
    path: "/api/auth/logout",
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  const rawCookies = Array.isArray(res.rawSetCookie) ? res.rawSetCookie.join("; ") : (res.rawSetCookie || "");
  assert.ok(res.cookie.includes("token=") || rawCookies.includes("token=;"));
});
