const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Campaign = require("../models/Campaign");
const Revision = require("../models/Revision");
const { runComplianceReview, GeminiServiceError } = require("../services/geminiService");
const withMongoTransaction = require("../services/withMongoTransaction");
const { authMiddleware, requireRole } = require("./auth");

router.post("/ai-review", authMiddleware, requireRole("freelancer"), async (req, res) => {
  try {
    const { submissionId } = req.body || {};
    if (typeof submissionId !== "string" || !/^[a-f\d]{24}$/i.test(submissionId)) {
      return res.status(400).json({ error: "A valid submissionId is required" });
    }

    const submission = await Submission.findOne({
      _id: submissionId,
      freelancerId: req.user.userId,
    });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    if (!["Submitted for Brand Approval", "Resubmitted"].includes(submission.status)) {
      return res.status(409).json({
        error: "Submit or resubmit this draft before requesting AI analysis.",
      });
    }

    const [assignment, campaign] = await Promise.all([
      Assignment.findOne({
        _id: submission.assignmentId,
        freelancerId: req.user.userId,
        brandId: submission.brandId,
      }),
      Campaign.findOne({
        _id: submission.campaignId,
        brandId: submission.brandId,
      }),
    ]);
    if (!assignment || !campaign) {
      return res.status(404).json({ error: "Campaign assignment not found" });
    }

    const guidelines = [
      campaign.brief?.guidelines,
      campaign.brief?.contentRequirements,
    ]
      .filter((value) => typeof value === "string" && value.trim())
      .join("\n\nContent requirements:\n");

    const aiResult = await runComplianceReview({
      content: submission.body,
      brandGuidelines: guidelines,
      campaignTitle: campaign.name,
      platform: submission.format || campaign.channels[0] || "",
    });

    const review = await withMongoTransaction(async (session) => {
      const currentSubmission = await Submission.findOne({
        _id: submission._id,
        freelancerId: req.user.userId,
        status: { $in: ["Submitted for Brand Approval", "Resubmitted"] },
      }).session(session);
      if (!currentSubmission || currentSubmission.body !== submission.body) {
        const error = new Error("Submission changed while its AI review was running.");
        error.status = 409;
        throw error;
      }

      const currentAssignment = await Assignment.findOne({
        _id: assignment._id,
        freelancerId: req.user.userId,
      }).session(session);
      if (!currentAssignment) {
        const error = new Error("Campaign assignment not found");
        error.status = 404;
        throw error;
      }

      const review = await Review.findOneAndUpdate(
        { submissionId: currentSubmission._id },
        {
          $set: {
            campaignId: currentSubmission.campaignId,
            freelancerId: currentSubmission.freelancerId,
            brandId: currentSubmission.brandId,
            title: currentSubmission.title,
            platform: currentSubmission.format || campaign.channels[0] || "",
            aiResult,
            decision: "pending",
            auditScore: aiResult.auditScore,
            integrityScore: aiResult.integrityScore,
            criticalRisk: aiResult.criticalRisk,
            toneDrift: aiResult.toneDrift,
            factMatch: aiResult.factMatch,
            whisperConfidence: aiResult.whisperConfidence,
            gateThreshold: aiResult.gateThreshold,
            findings: aiResult.findings,
            toneFit: aiResult.toneFit,
            transcript: aiResult.transcript,
            hasDisclaimer: aiResult.hasDisclaimer,
            tamperAlerts: aiResult.tamperAlerts,
            originalContent: currentSubmission.body,
            sanitizedContent: aiResult.sanitizedContent,
            reviewedBy: null,
            reviewedAt: null,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          session,
        }
      );

      currentSubmission.status = "AI Review Completed";
      await currentSubmission.save({ session });
      currentAssignment.status = "ai-review";
      await currentAssignment.save({ session });
      return { review, submission: currentSubmission };
    });

    res.json({ ...review, message: "AI compliance analysis completed" });
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid submission identifier" });
    }
    console.error("AI review failed:", error.message);
    res.status(500).json({ error: "Could not analyze this submission" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter =
      req.user.role === "brand"
        ? { brandId: req.user.userId }
        : req.user.role === "freelancer"
          ? { freelancerId: req.user.userId }
          : null;
    if (!filter) return res.status(403).json({ error: "Role not allowed" });

    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    console.error("Review list failed:", error.message);
    res.status(500).json({ error: "Could not load reviews" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid review identifier" });
    }
    const filter =
      req.user.role === "brand"
        ? { _id: req.params.id, brandId: req.user.userId }
        : req.user.role === "freelancer"
          ? { _id: req.params.id, freelancerId: req.user.userId }
          : null;
    if (!filter) return res.status(403).json({ error: "Role not allowed" });

    const review = await Review.findOne(filter);
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json({ review });
  } catch (error) {
    console.error("Review lookup failed:", error.message);
    res.status(500).json({ error: "Could not load review" });
  }
});

router.put("/:id/decision", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const { decision, note } = req.body || {};
    if (!["approved", "revision", "rejected"].includes(decision)) {
      return res.status(400).json({
        error: "Decision must be approved, revision, or rejected.",
      });
    }
    if (decision === "revision" && (typeof note !== "string" || note.trim().length < 3)) {
      return res.status(400).json({ error: "A written revision reason is required." });
    }
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid review identifier" });
    }

    const result = await withMongoTransaction(async (session) => {
      const review = await Review.findOne({
        _id: req.params.id,
        brandId: req.user.userId,
      }).session(session);
      if (!review) {
        const error = new Error("Review not found");
        error.status = 404;
        throw error;
      }
      if (review.decision !== "pending") {
        const error = new Error("This review has already been decided.");
        error.status = 409;
        throw error;
      }

      const submission = await Submission.findOne({
        _id: review.submissionId,
        brandId: req.user.userId,
        status: "AI Review Completed",
      }).session(session);
      if (!submission) {
        const error = new Error(
          "Only an AI-analyzed submission can receive a brand decision."
        );
        error.status = 409;
        throw error;
      }

      review.decision = decision;
      review.reviewedBy = req.user.userId;
      review.reviewedAt = new Date();
      await review.save({ session });

      if (decision === "approved") {
        submission.status = "Approved";
        const campaign = await Campaign.findById(submission.campaignId).session(session);
        if (campaign) {
          campaign.submissionsDone = (campaign.submissionsDone || 0) + 1;
          campaign.aiPass = (campaign.aiPass || 0) + 1;
          if (campaign.submissionsDone >= (campaign.submissionsTotal || 1)) {
            campaign.status = "completed";
          }
          await campaign.save({ session });
        }
      } else if (decision === "rejected") {
        submission.status = "Rejected";
      } else {
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
        await Revision.create(
          [
            {
              submissionId: submission._id,
              assignmentId: submission.assignmentId,
              campaignId: submission.campaignId,
              freelancerId: submission.freelancerId,
              brandId: submission.brandId,
              title: submission.title,
              note: note.trim(),
              status: "open",
            },
          ],
          { session }
        );
      }
      await submission.save({ session });

      const assignment = await Assignment.findOneAndUpdate(
        { _id: submission.assignmentId, brandId: req.user.userId },
        {
          status:
            decision === "approved"
              ? "approved"
              : decision === "rejected"
                ? "rejected"
                : "revision-requested",
        },
        { new: true, runValidators: true, session }
      );
      if (!assignment) {
        const error = new Error("Assignment not found.");
        error.status = 404;
        throw error;
      }
      return { review, submission };
    });

    res.json({ ...result, message: `Review ${decision}` });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid review identifier" });
    }
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("Review decision failed:", error.message);
    res.status(500).json({ error: "Could not save the brand decision" });
  }
});

module.exports = router;
