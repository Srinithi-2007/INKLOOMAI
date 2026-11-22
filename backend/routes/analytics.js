const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Campaign = require("../models/Campaign");
const Submission = require("../models/Submission");
const { authMiddleware, requireRole } = require("./auth");

const router = express.Router();

// GET /api/analytics/governance - brand-level governance intelligence
router.get("/governance", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const brandId = new mongoose.Types.ObjectId(req.user.userId);

    const [campaigns, submissions, reviews] = await Promise.all([
      Campaign.find({ brandId }),
      Submission.find({ brandId }),
      Review.find({ brandId }).sort({ updatedAt: -1 }),
    ]);

    const totalCampaigns = campaigns.length;
    const totalSubmissions = submissions.length;
    const totalReviews = reviews.length;

    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    let totalAuditScore = 0;
    let totalIntegrityScore = 0;

    const riskDistribution = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    const violationCounts = new Map();

    for (const r of reviews) {
      if (r.decision === "approved") approvedCount++;
      else if (r.decision === "rejected") rejectedCount++;
      else pendingCount++;

      totalAuditScore += typeof r.auditScore === "number" ? r.auditScore : 100;
      totalIntegrityScore += typeof r.integrityScore === "number" ? r.integrityScore : 100;

      const risk =
        typeof r.riskLevel === "string"
          ? r.riskLevel
          : r.auditScore >= 85
            ? "Low"
            : r.auditScore >= 70
              ? "Medium"
              : "High";
      riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;

      // Extract compliance findings
      if (Array.isArray(r.findings)) {
        for (const finding of r.findings) {
          const key = finding.title || finding.rule || "Policy Violation";
          violationCounts.set(key, (violationCounts.get(key) || 0) + 1);
        }
      }
    }

    const totalDecisions = approvedCount + rejectedCount;
    const approvalRate = totalDecisions > 0 ? Math.round((approvedCount / totalDecisions) * 100) : 100;
    const rejectionRate = totalDecisions > 0 ? Math.round((rejectedCount / totalDecisions) * 100) : 0;

    const revisionRequestedCount = submissions.filter(
      (s) => s.status === "Revision Requested" || (s.milestones && s.milestones.some((m) => m.step === "Revision Requested"))
    ).length;
    const revisionFrequency =
      totalSubmissions > 0 ? Math.round((revisionRequestedCount / totalSubmissions) * 100) : 0;

    const averageComplianceScore =
      totalReviews > 0 ? Math.round(totalAuditScore / totalReviews) : 100;
    const averageIntegrityScore =
      totalReviews > 0 ? Math.round(totalIntegrityScore / totalReviews) : 100;

    // Recurring violations sorted by occurrence count
    const recurringViolations = Array.from(violationCounts.entries())
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Platform breakdown
    const platformStats = {
      LinkedIn: { submissions: 0, approved: 0, avgScore: 0, totalScore: 0 },
      Twitter: { submissions: 0, approved: 0, avgScore: 0, totalScore: 0 },
      Instagram: { submissions: 0, approved: 0, avgScore: 0, totalScore: 0 },
      YouTube: { submissions: 0, approved: 0, avgScore: 0, totalScore: 0 },
      Other: { submissions: 0, approved: 0, avgScore: 0, totalScore: 0 },
    };

    // Build map of campaignId -> campaign
    const campaignMap = new Map();
    for (const c of campaigns) {
      campaignMap.set(c._id.toString(), c);
    }

    for (const s of submissions) {
      const c = campaignMap.get(s.campaignId.toString());
      const platformName = s.format || c?.channels?.[0] || c?.deliverables?.[0] || "Other";
      let key = "Other";
      if (/linkedin/i.test(platformName)) key = "LinkedIn";
      else if (/twitter|x\b/i.test(platformName)) key = "Twitter";
      else if (/instagram/i.test(platformName)) key = "Instagram";
      else if (/youtube/i.test(platformName)) key = "YouTube";

      platformStats[key].submissions++;
      if (s.status === "Approved") {
        platformStats[key].approved++;
      }
    }

    // Attach review scores to platforms
    for (const r of reviews) {
      const c = campaignMap.get(r.campaignId?.toString());
      const platformName = r.platform || c?.channels?.[0] || c?.deliverables?.[0] || "Other";
      let key = "Other";
      if (/linkedin/i.test(platformName)) key = "LinkedIn";
      else if (/twitter|x\b/i.test(platformName)) key = "Twitter";
      else if (/instagram/i.test(platformName)) key = "Instagram";
      else if (/youtube/i.test(platformName)) key = "YouTube";

      platformStats[key].totalScore += r.auditScore || 100;
    }

    const platformBreakdown = Object.entries(platformStats).map(([platform, data]) => ({
      platform,
      submissions: data.submissions,
      approved: data.approved,
      complianceScore:
        data.submissions > 0 && data.totalScore > 0
          ? Math.round(data.totalScore / Math.max(1, reviews.length))
          : 100,
    }));

    // Recent audit trail
    const auditTrail = reviews.slice(0, 10).map((r) => ({
      id: r._id.toString(),
      submissionId: r.submissionId.toString(),
      campaignId: r.campaignId?.toString() || null,
      decision: r.decision,
      auditScore: r.auditScore,
      integrityScore: r.integrityScore,
      riskLevel: r.riskLevel,
      timestamp: r.updatedAt || r.createdAt,
    }));

    return res.json({
      analytics: {
        totalCampaigns,
        totalSubmissions,
        totalReviews,
        decisions: {
          approved: approvedCount,
          rejected: rejectedCount,
          pending: pendingCount,
        },
        approvalRate,
        rejectionRate,
        revisionFrequency,
        averageComplianceScore,
        averageIntegrityScore,
        riskDistribution,
        recurringViolations,
        platformBreakdown,
        auditTrail,
      },
    });
  } catch (err) {
    console.error("Governance analytics calculation failed:", err);
    return res.status(500).json({ error: "Failed to generate governance analytics" });
  }
});

module.exports = router;
