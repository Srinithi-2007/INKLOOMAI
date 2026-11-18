const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Review = require("../models/Review");
const Revision = require("../models/Revision");
const { authMiddleware, requireRole } = require("./auth");

// POST /api/submissions - create or update a submission (freelancer only)
router.post("/", authMiddleware, requireRole("freelancer"), async (req, res) => {
  try {
    const {
      assignmentId,
      campaignId,
      title,
      body,
      format,
      attachedAssets,
    } = req.body || {};

    if (
      typeof assignmentId !== "string" ||
      !/^[a-f\d]{24}$/i.test(assignmentId) ||
      typeof campaignId !== "string" ||
      !/^[a-f\d]{24}$/i.test(campaignId) ||
      typeof title !== "string" || !title.trim() || title.length > 200 ||
      typeof body !== "string" || !body.trim() || body.length > 50000
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      campaignId,
      freelancerId: req.user.userId,
    });
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (!["accepted", "in-draft"].includes(assignment.status)) {
      return res.status(409).json({ error: "Accept this assignment before drafting." });
    }

    const charCount = body ? body.length : 0;
    const wordCount = body ? body.split(/\s+/).filter(Boolean).length : 0;

    let submission = await Submission.findOne({
      assignmentId,
      freelancerId: req.user.userId,
    });

    if (submission) {
      if (submission.status !== "Draft") {
        return res.status(409).json({
          error: "Only draft submissions can be edited. Use resubmit after revision feedback.",
        });
      }
      submission.previousContentSnapshot = submission.body;
      submission.title = title.trim();
      submission.body = body;
      submission.format = format || submission.format;
      submission.attachedAssets = attachedAssets || submission.attachedAssets;
      submission.charCount = charCount;
      submission.wordCount = wordCount;
      submission.contentSnapshot = body;
      await submission.save();
    } else {
      submission = new Submission({
        assignmentId,
        campaignId,
        freelancerId: req.user.userId,
        brandId: assignment.brandId,
        title: title.trim(),
        body,
        format: format || "",
        attachedAssets: attachedAssets || [],
        charCount,
        wordCount,
        status: "Draft",
        version: "1.0",
        contentSnapshot: body,
      });
      await submission.save();
    }

    assignment.status = "in-draft";
    await assignment.save();

    res.json({ submission, message: "Submission saved successfully" });
  } catch (err) {
    console.error("Submission save failed:", err.message);
    res.status(500).json({ error: "Could not save submission" });
  }
});

// GET /api/submissions - list submissions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter =
      req.user.role === "brand"
        ? { brandId: req.user.userId }
        : req.user.role === "freelancer"
          ? { freelancerId: req.user.userId }
          : null;
    if (!filter) return res.status(403).json({ error: "Role not allowed" });

    const submissions = await Submission.find(filter).sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    console.error("Submission list failed:", err.message);
    res.status(500).json({ error: "Could not load submissions" });
  }
});

// GET /api/submissions/:id - get single submission
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid submission identifier" });
    }
    const filter =
      req.user.role === "brand"
        ? { _id: req.params.id, brandId: req.user.userId }
        : req.user.role === "freelancer"
          ? { _id: req.params.id, freelancerId: req.user.userId }
          : null;
    if (!filter) return res.status(403).json({ error: "Role not allowed" });
    const submission = await Submission.findOne(filter);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json({ submission });
  } catch (err) {
    console.error("Submission lookup failed:", err.message);
    res.status(500).json({ error: "Could not load submission" });
  }
});

// PUT /api/submissions/:id/submit - submit for brand approval (freelancer only)
router.put("/:id/submit", authMiddleware, requireRole("freelancer"), async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid submission identifier" });
    }
    const submission = await Submission.findOne({
      _id: req.params.id,
      freelancerId: req.user.userId,
    });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    if (submission.status !== "Draft") {
      return res.status(409).json({ error: "Only a saved draft can be submitted." });
    }

    submission.status = "Submitted for Brand Approval";
    submission.contentSnapshot = submission.body;
    await submission.save();

    await Assignment.findOneAndUpdate(
      { _id: submission.assignmentId, freelancerId: req.user.userId },
      { status: "submitted" }
    );

    res.json({ submission, message: "Submitted for brand approval" });
  } catch (err) {
    console.error("Submission submit failed:", err.message);
    res.status(500).json({ error: "Could not submit content" });
  }
});

// PUT /api/submissions/:id/approve - approve submission (brand only)
router.put("/:id/approve", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid submission identifier" });
    }
    const submission = await Submission.findOne({
      _id: req.params.id,
      brandId: req.user.userId,
    });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    const review = await Review.findOne({
      submissionId: submission._id,
      brandId: req.user.userId,
    });
    if (
      !review ||
      review.decision !== "pending" ||
      submission.status !== "AI Review Completed"
    ) {
      return res.status(409).json({
        error: "A pending AI review is required before approving this submission.",
      });
    }

    submission.status = "Approved";
    await submission.save();
    review.decision = "approved";
    review.reviewedBy = req.user.userId;
    review.reviewedAt = new Date();
    await review.save();

    await Assignment.findOneAndUpdate(
      { _id: submission.assignmentId, brandId: req.user.userId },
      { status: "approved" }
    );

    res.json({ submission, message: "Submission approved" });
  } catch (err) {
    console.error("Submission approval failed:", err.message);
    res.status(500).json({ error: "Could not approve submission" });
  }
});

// PUT /api/submissions/:id/revision-requested - request revision (brand only)
router.put("/:id/revision-requested", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const { note } = req.body || {};
    if (typeof note !== "string" || note.trim().length < 3) {
      return res.status(400).json({ error: "Revision note is required" });
    }

    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid submission identifier" });
    }
    const submission = await Submission.findOne({
      _id: req.params.id,
      brandId: req.user.userId,
      status: "AI Review Completed",
    });
    if (!submission) {
      return res.status(404).json({ error: "AI-reviewed submission not found" });
    }
    const review = await Review.findOne({
      submissionId: submission._id,
      brandId: req.user.userId,
      decision: "pending",
    });
    if (!review) {
      return res.status(409).json({ error: "A pending AI review is required." });
    }

    submission.status = "Revision Requested";
    submission.feedback = {
      reviewerName: req.body?.reviewerName || "Brand Admin",
      reviewerRole: "Brand Admin",
      timestamp: new Date().toISOString(),
      note: note.trim(),
      suggestions: Array.isArray(req.body?.suggestions)
        ? req.body.suggestions.filter((item) => typeof item === "string")
        : [],
    };
    await submission.save();
    review.decision = "revision";
    review.reviewedBy = req.user.userId;
    review.reviewedAt = new Date();
    await review.save();

    const revision = new Revision({
      submissionId: submission._id,
      assignmentId: submission.assignmentId,
      campaignId: submission.campaignId,
      freelancerId: submission.freelancerId,
      brandId: submission.brandId,
      title: submission.title,
      note: note.trim(),
      status: "open",
    });
    await revision.save();

    await Assignment.findOneAndUpdate(
      { _id: submission.assignmentId, brandId: req.user.userId },
      { status: "revision-requested" }
    );

    res.json({ submission, revision, message: "Revision requested" });
  } catch (err) {
    console.error("Revision request failed:", err.message);
    res.status(500).json({ error: "Could not request revision" });
  }
});

// PUT /api/submissions/:id/resubmit - resubmit after revision (freelancer only)
router.put("/:id/resubmit", authMiddleware, requireRole("freelancer"), async (req, res) => {
  try {
    const { body: updatedBody, title } = req.body || {};
    if (
      typeof updatedBody !== "string" ||
      !updatedBody.trim() ||
      updatedBody.length > 50000 ||
      (title !== undefined && (typeof title !== "string" || !title.trim() || title.length > 200))
    ) {
      return res.status(400).json({ error: "A valid title and content body are required." });
    }

    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid submission identifier" });
    }
    const submission = await Submission.findOne({
      _id: req.params.id,
      freelancerId: req.user.userId,
      status: "Revision Requested",
    });
    if (!submission) {
      return res.status(404).json({ error: "Revision request not found" });
    }

    submission.previousContentSnapshot = submission.body;
    submission.body = updatedBody.trim();
    if (title) submission.title = title.trim();
    submission.charCount = submission.body.length;
    submission.wordCount = submission.body.split(/\s+/).filter(Boolean).length;
    submission.contentSnapshot = submission.body;
    const currentVersion = Number.parseFloat(submission.version);
    submission.version = Number.isFinite(currentVersion)
      ? (currentVersion + 0.1).toFixed(1)
      : "2.0";
    submission.status = "Resubmitted";
    await submission.save();

    await Revision.findOneAndUpdate(
      { submissionId: submission._id, status: "open" },
      { status: "resubmitted", resubmittedAt: new Date(), updatedContent: submission.body }
    );

    await Assignment.findOneAndUpdate(
      { _id: submission.assignmentId, freelancerId: req.user.userId },
      { status: "resubmitted" }
    );

    res.json({ submission, message: "Content resubmitted for review" });
  } catch (err) {
    console.error("Submission resubmit failed:", err.message);
    res.status(500).json({ error: "Could not resubmit content" });
  }
});

module.exports = router;