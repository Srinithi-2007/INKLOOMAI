const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Review = require("../models/Review");
const Revision = require("../models/Revision");

const testRunId = Date.now();
const brandEmail = `wf_brand_${testRunId}@example.com`;
const freelancerEmail = `wf_freelancer_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";
let brandId = "";
let freelancerId = "";
let campaignId = "";
let assignmentId = "";
let submissionId = "";
let reviewId = "";

test.before(async () => {
  await startTestServer();

  // Create brand
  const bRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Workflow Brand Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      brandName: "AlphaBrand",
    },
  });
  brandCookie = bRes.cookie;
  brandId = bRes.body.user.id;

  // Create freelancer
  const fRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Workflow Freelancer",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
    },
  });
  freelancerCookie = fRes.cookie;
  freelancerId = fRes.body.user.id;

  // Create campaign
  const cRes = await request({
    method: "POST",
    path: "/api/campaigns",
    cookie: brandCookie,
    body: {
      name: "Workflow Launch Campaign",
      objective: "Deliver verified compliant copy.",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      channels: ["LinkedIn"],
      brief: {
        contentRequirements: "Highlight reliability and AI brand safety.",
        guidelines: "Professional and authentic tone.",
      },
    },
  });
  campaignId = cRes.body.campaign.id;

  // Create assignment
  const aRes = await request({
    method: "POST",
    path: "/api/assignments",
    cookie: brandCookie,
    body: {
      campaignId,
      freelancerId,
      compensation: "$1000",
    },
  });
  assignmentId = aRes.body.assignment.id;

  // Freelancer accepts assignment
  await request({
    method: "PUT",
    path: `/api/assignments/${assignmentId}/status`,
    cookie: freelancerCookie,
    body: { status: "accepted" },
  });
});

test.after(async () => {
  if (campaignId) {
    await Revision.deleteMany({ campaignId });
    await Review.deleteMany({ campaignId });
    await Submission.deleteMany({ campaignId });
    await Assignment.deleteMany({ campaignId });
    await Campaign.deleteOne({ _id: campaignId });
  }
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  await stopTestServer();
});

test("POST /api/submissions creates content draft with character, word, and reading time metrics", async () => {
  const contentBody = "Inkloom AI empowers enterprise brands and creators to collaborate with confidence. Our automated heuristics verify voice and guardrails.";
  const res = await request({
    method: "POST",
    path: "/api/submissions",
    cookie: freelancerCookie,
    body: {
      assignmentId,
      campaignId,
      title: "Draft Post V1",
      body: contentBody,
      format: "LinkedIn Post",
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.submission.status, "Draft");
  assert.equal(res.body.submission.title, "Draft Post V1");
  assert.equal(res.body.submission.charCount, contentBody.length);
  assert.equal(res.body.submission.wordCount, 18);
  assert.ok(res.body.submission.readingTimeSeconds > 0);
  submissionId = res.body.submission.id;
});

test("POST /api/submissions allows updating an existing draft", async () => {
  const updatedBody = "Inkloom AI empowers enterprise brands and creators to collaborate with confidence. Updated with clearer call-to-action.";
  const res = await request({
    method: "POST",
    path: "/api/submissions",
    cookie: freelancerCookie,
    body: {
      assignmentId,
      campaignId,
      title: "Draft Post V1 Updated",
      body: updatedBody,
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.submission.id, submissionId);
  assert.equal(res.body.submission.body, updatedBody);
});

test("PUT /api/submissions/:id/submit submits draft for brand approval", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/submissions/${submissionId}/submit`,
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.submission.status, "Submitted for Brand Approval");

  // Verify assignment status updated to submitted
  const aRes = await request({
    method: "GET",
    path: `/api/assignments/${assignmentId}`,
    cookie: freelancerCookie,
  });
  assert.equal(aRes.body.assignment.status, "submitted");
});

test("PUT /api/submissions/:id/approve rejects approval if AI review is not completed", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/submissions/${submissionId}/approve`,
    cookie: brandCookie,
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /pending AI review is required/i);
});

test("Simulate and persist AI review record for submission", async () => {
  // Create or update review directly to simulate AI compliance analysis completion
  const review = await Review.findOneAndUpdate(
    { submissionId },
    {
      $set: {
        campaignId,
        freelancerId,
        brandId,
        title: "Draft Post V1 Updated",
        platform: "LinkedIn Post",
        decision: "pending",
        auditScore: 92,
        integrityScore: 90,
        criticalRisk: 0,
        toneDrift: 5,
        factMatch: 95,
        whisperConfidence: 88,
        gateThreshold: 85,
        findings: [
          {
            id: "f-1",
            title: "Clarity Enhancement",
            rule: "Clear CTA",
            claim: "collaborate with confidence",
            suggestion: "Add link to live demo",
            confidence: 90,
            resolved: false,
          },
        ],
        toneFit: { label: "Professional", detail: "Matches enterprise brand guidelines", fit: 92 },
        hasDisclaimer: false,
        tamperAlerts: 0,
        originalContent: "Inkloom AI empowers enterprise brands...",
        sanitizedContent: "Inkloom AI empowers enterprise brands...",
      },
    },
    { new: true, upsert: true }
  );

  reviewId = review._id.toString();

  // Set submission to AI Review Completed
  const sub = await Submission.findById(submissionId);
  sub.status = "AI Review Completed";
  await sub.save();
  assert.equal(sub.status, "AI Review Completed");
});

test("GET /api/reviews returns reviews list for Brand and Freelancer", async () => {
  const bRes = await request({
    method: "GET",
    path: "/api/reviews",
    cookie: brandCookie,
  });
  assert.equal(bRes.status, 200);
  assert.ok(bRes.body.reviews.find((r) => r.id === reviewId));

  const fRes = await request({
    method: "GET",
    path: "/api/reviews",
    cookie: freelancerCookie,
  });
  assert.equal(fRes.status, 200);
  assert.ok(fRes.body.reviews.find((r) => r.id === reviewId));
});

test("PUT /api/submissions/:id/revision-requested requests revisions and creates Revision history record", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/submissions/${submissionId}/revision-requested`,
    cookie: brandCookie,
    body: {
      note: "Please refine the CTA to directly mention the Q4 launch webinar.",
      suggestions: ["Mention webinar on Thursday", "Include registration link"],
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.submission.status, "Revision Requested");
  assert.ok(res.body.revision);
  assert.equal(res.body.revision.status, "open");
  assert.equal(res.body.revision.note, "Please refine the CTA to directly mention the Q4 launch webinar.");
});

test("GET /api/submissions/:id/revisions returns the revision history", async () => {
  const res = await request({
    method: "GET",
    path: `/api/submissions/${submissionId}/revisions`,
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.revisions));
  assert.equal(res.body.revisions.length, 1);
  assert.equal(res.body.revisions[0].status, "open");
});

test("PUT /api/submissions/:id/resubmit allows Freelancer to resubmit revised content", async () => {
  const revisedBody = "Inkloom AI empowers enterprise brands and creators to collaborate with confidence. Join our live Q4 webinar this Thursday to see it in action!";
  const res = await request({
    method: "PUT",
    path: `/api/submissions/${submissionId}/resubmit`,
    cookie: freelancerCookie,
    body: {
      body: revisedBody,
      title: "Draft Post V2",
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.submission.status, "Resubmitted");
  assert.equal(res.body.submission.version, "1.1");
  assert.equal(res.body.submission.body, revisedBody);

  // Verify Revision record updated to resubmitted
  const revRes = await request({
    method: "GET",
    path: `/api/submissions/${submissionId}/revisions`,
    cookie: brandCookie,
  });
  assert.equal(revRes.body.revisions[0].status, "resubmitted");
});

test("PUT /api/reviews/:id/decision allows Brand to approve revised review", async () => {
  // Re-ready review for approval
  const sub = await Submission.findById(submissionId);
  sub.status = "AI Review Completed";
  await sub.save();

  const rev = await Review.findById(reviewId);
  rev.decision = "pending";
  await rev.save();

  const res = await request({
    method: "PUT",
    path: `/api/reviews/${reviewId}/decision`,
    cookie: brandCookie,
    body: { decision: "approved" },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.review.decision, "approved");
  assert.equal(res.body.submission.status, "Approved");

  // Verify Campaign submissionsDone incremented and status completed
  const cRes = await request({
    method: "GET",
    path: `/api/campaigns/${campaignId}`,
    cookie: brandCookie,
  });
  assert.equal(cRes.body.campaign.submissionsDone, 1);
  assert.equal(cRes.body.campaign.status, "completed");
});

test("Both Brand and Freelancer retrieve the same persisted Approved status from MongoDB", async () => {
  const bSub = await request({
    method: "GET",
    path: `/api/submissions/${submissionId}`,
    cookie: brandCookie,
  });
  const fSub = await request({
    method: "GET",
    path: `/api/submissions/${submissionId}`,
    cookie: freelancerCookie,
  });
  assert.equal(bSub.body.submission.status, "Approved");
  assert.equal(fSub.body.submission.status, "Approved");
  assert.equal(bSub.body.submission.status, fSub.body.submission.status);
});
