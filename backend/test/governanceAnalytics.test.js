const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Review = require("../models/Review");

const testRunId = Date.now();
const brandEmail = `brand_gov_${testRunId}@example.com`;
const freelancerEmail = `free_gov_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";
let brandUserId = "";
let freelancerUserId = "";
let testCampaignId = "";
let testSubmissionId = "";
let testReviewId = "";

test.before(async () => {
  await startTestServer();

  const bRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Brand Gov Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      brandName: "Apex Enterprise",
    },
  });
  brandCookie = bRes.cookie;
  brandUserId = bRes.body.user.id;

  const fRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Freelancer Gov User",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
    },
  });
  freelancerCookie = fRes.cookie;
  freelancerUserId = fRes.body.user.id;

  // Create Campaign
  const camp = await Campaign.create({
    brandId: brandUserId,
    name: "Governance Analytics Campaign",
    objective: "Monitor brand governance compliance and risk",
    date: "2026-06-01",
    status: "active",
    channels: ["LinkedIn"],
    deliverables: ["LinkedIn Post"],
  });
  testCampaignId = camp._id;

  // Create Assignment
  const asg = await Assignment.create({
    campaignId: testCampaignId,
    campaignName: camp.name,
    freelancerId: freelancerUserId,
    freelancerName: "Freelancer Gov User",
    brandId: brandUserId,
    brandName: "Apex Enterprise",
    status: "in-draft",
    deliverables: ["LinkedIn Post"],
  });

  // Create Submission
  const sub = await Submission.create({
    assignmentId: asg._id,
    campaignId: testCampaignId,
    freelancerId: freelancerUserId,
    brandId: brandUserId,
    title: "Sample Governance Deliverable",
    body: "This is a tested governance submission body with full compliance checking.",
    status: "Approved",
  });
  testSubmissionId = sub._id;

  // Create Review with simulated findings
  const rev = await Review.create({
    submissionId: testSubmissionId,
    campaignId: testCampaignId,
    freelancerId: freelancerUserId,
    brandId: brandUserId,
    title: "Sample Governance Review",
    auditScore: 88,
    integrityScore: 92,
    decision: "approved",
    findings: [
      {
        rule: "Claims Substantiation",
        title: "Unsubstantiated performance claim",
        severity: "medium",
        passed: false,
        status: "failed",
      },
      {
        rule: "Banned Keywords",
        title: "Banned phrase detected",
        severity: "high",
        passed: false,
        status: "failed",
      },
    ],
  });
  testReviewId = rev._id;
});

test.after(async () => {
  if (testReviewId) await Review.findByIdAndDelete(testReviewId);
  if (testSubmissionId) await Submission.findByIdAndDelete(testSubmissionId);
  if (testCampaignId) {
    await Assignment.deleteMany({ campaignId: testCampaignId });
    await Campaign.findByIdAndDelete(testCampaignId);
  }
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  await stopTestServer();
});

test("GET /api/analytics/governance rejects unauthenticated request with 401", async () => {
  const res = await request({
    method: "GET",
    path: "/api/analytics/governance",
  });
  assert.equal(res.status, 401);
});

test("GET /api/analytics/governance forbids Freelancer with 403", async () => {
  const res = await request({
    method: "GET",
    path: "/api/analytics/governance",
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 403);
});

test("GET /api/analytics/governance returns complete governance metrics for Brand Admin", async () => {
  const res = await request({
    method: "GET",
    path: "/api/analytics/governance",
    cookie: brandCookie,
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.analytics);

  const { analytics } = res.body;

  // Overview metrics
  assert.equal(analytics.totalCampaigns, 1);
  assert.equal(analytics.totalSubmissions, 1);
  assert.equal(analytics.totalReviews, 1);
  assert.equal(analytics.decisions.approved, 1);
  assert.equal(analytics.decisions.rejected, 0);
  assert.equal(analytics.approvalRate, 100);
  assert.equal(analytics.rejectionRate, 0);

  // Scores
  assert.equal(analytics.averageComplianceScore, 88);
  assert.equal(analytics.averageIntegrityScore, 92);
  assert.equal(analytics.riskDistribution.Low, 1);

  // Recurring violations
  assert.ok(Array.isArray(analytics.recurringViolations));
  assert.equal(analytics.recurringViolations.length, 2);
  assert.ok(
    analytics.recurringViolations.some(
      (v) => v.rule === "Unsubstantiated performance claim" && v.count === 1
    )
  );

  // Platform breakdown
  assert.ok(Array.isArray(analytics.platformBreakdown));
  const linkedin = analytics.platformBreakdown.find((p) => p.platform === "LinkedIn");
  assert.ok(linkedin);
  assert.equal(linkedin.submissions, 1);
  assert.equal(linkedin.approved, 1);

  // Audit trail
  assert.ok(Array.isArray(analytics.auditTrail));
  assert.equal(analytics.auditTrail.length, 1);
  assert.equal(analytics.auditTrail[0].auditScore, 88);
  assert.equal(analytics.auditTrail[0].decision, "approved");
});
