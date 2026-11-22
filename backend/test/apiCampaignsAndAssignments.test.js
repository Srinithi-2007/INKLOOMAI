const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Assignment = require("../models/Assignment");

const testRunId = Date.now();
const brandEmail = `camp_brand_${testRunId}@example.com`;
const freelancerEmail = `camp_freelancer_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";
let brandId = "";
let freelancerId = "";
let campaignId = "";
let assignmentId = "";

test.before(async () => {
  await startTestServer();

  // Register brand
  const bRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Campaign Brand",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      brandName: "BrandVanguard",
    },
  });
  brandCookie = bRes.cookie;
  brandId = bRes.body.user.id;

  // Register freelancer
  const fRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Creative Creator",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
    },
  });
  freelancerCookie = fRes.cookie;
  freelancerId = fRes.body.user.id;
});

test.after(async () => {
  if (campaignId) {
    await Assignment.deleteMany({ campaignId });
    await Campaign.deleteOne({ _id: campaignId });
  }
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  await stopTestServer();
});

test("POST /api/campaigns forbids Freelancer from creating a campaign", async () => {
  const res = await request({
    method: "POST",
    path: "/api/campaigns",
    cookie: freelancerCookie,
    body: {
      name: "Freelancer Campaign",
      objective: "Should fail",
      date: new Date().toISOString(),
    },
  });
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Role brand required/i);
});

test("POST /api/campaigns validates required fields", async () => {
  const res = await request({
    method: "POST",
    path: "/api/campaigns",
    cookie: brandCookie,
    body: { name: "" }, // missing objective and date
  });
  assert.equal(res.status, 400);
});

test("POST /api/campaigns allows Brand to create a campaign", async () => {
  const res = await request({
    method: "POST",
    path: "/api/campaigns",
    cookie: brandCookie,
    body: {
      name: "Q4 Product Launch",
      objective: "Drive signups with high-converting social copy and tone compliance.",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      channels: ["LinkedIn", "Twitter/X"],
      brief: {
        contentRequirements: "Must mention key features: speed, accuracy, and AI tone checks.",
        guidelines: "Keep tone professional, engaging, and avoid unverified factual claims.",
        aspectRatio: "16:9",
      },
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.campaign.name, "Q4 Product Launch");
  assert.equal(res.body.campaign.status, "draft");
  assert.equal(res.body.campaign.brandName, "BrandVanguard");
  campaignId = res.body.campaign.id;
});

test("GET /api/campaigns returns Brand's campaigns", async () => {
  const res = await request({
    method: "GET",
    path: "/api/campaigns",
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.campaigns));
  const found = res.body.campaigns.find((c) => c.id === campaignId);
  assert.ok(found);
});

test("GET /api/campaigns/:id returns single campaign details", async () => {
  const res = await request({
    method: "GET",
    path: `/api/campaigns/${campaignId}`,
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.campaign.id, campaignId);
});

test("GET /api/campaigns/:id rejects invalid ObjectId format with 400", async () => {
  const res = await request({
    method: "GET",
    path: "/api/campaigns/not-a-valid-id",
    cookie: brandCookie,
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Invalid campaign identifier/i);
});

test("PUT /api/campaigns/:id updates campaign fields", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/campaigns/${campaignId}`,
    cookie: brandCookie,
    body: {
      objective: "Updated objective: Drive signups across global enterprise channels.",
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.campaign.objective, "Updated objective: Drive signups across global enterprise channels.");
});

test("POST /api/assignments allows Brand to assign Freelancer to campaign", async () => {
  const res = await request({
    method: "POST",
    path: "/api/assignments",
    cookie: brandCookie,
    body: {
      campaignId,
      freelancerId,
      deliverables: ["1x Long-form post", "3x Short teasers"],
      compensation: "$800 USD",
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.assignment.status, "assigned");
  assert.equal(res.body.assignment.freelancerName, "Creative Creator");
  assert.equal(res.body.assignment.compensation, "$800 USD");
  assignmentId = res.body.assignment.id;

  // Verify campaign transitioned to active and creatorIds includes freelancer
  const cRes = await request({
    method: "GET",
    path: `/api/campaigns/${campaignId}`,
    cookie: brandCookie,
  });
  assert.equal(cRes.body.campaign.status, "active");
  assert.equal(cRes.body.campaign.submissionsTotal, 1);
});

test("POST /api/assignments rejects duplicate assignment to same freelancer", async () => {
  const res = await request({
    method: "POST",
    path: "/api/assignments",
    cookie: brandCookie,
    body: {
      campaignId,
      freelancerId,
    },
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /already assigned/i);
});

test("GET /api/assignments returns assigned work for Freelancer", async () => {
  const res = await request({
    method: "GET",
    path: "/api/assignments",
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.assignments));
  const found = res.body.assignments.find((a) => a.id === assignmentId);
  assert.ok(found);
  assert.equal(found.status, "assigned");
});

test("PUT /api/assignments/:id/status allows Freelancer to accept assignment", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/assignments/${assignmentId}/status`,
    cookie: freelancerCookie,
    body: { status: "accepted" },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.assignment.status, "accepted");
});

test("PUT /api/assignments/:id/status rejects re-accepting already accepted assignment", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/assignments/${assignmentId}/status`,
    cookie: freelancerCookie,
    body: { status: "accepted" },
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /cannot be accepted/i);
});

test("DELETE /api/campaigns/:id prevents deleting a campaign with active assignments", async () => {
  const res = await request({
    method: "DELETE",
    path: `/api/campaigns/${campaignId}`,
    cookie: brandCookie,
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /Campaigns with assignments cannot be deleted/i);
});
