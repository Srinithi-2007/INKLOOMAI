const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Submission = require("../models/Submission");
const notificationService = require("../services/notificationService");
const { authMiddleware, requireRole } = require("./auth");

// POST /api/assignments - assign a freelancer to a campaign (brand only)
router.post("/", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const { campaignId, freelancerId, brief, dueDate, deliverables, compensation } = req.body || {};

    if (
      typeof campaignId !== "string" ||
      !/^[a-f\d]{24}$/i.test(campaignId) ||
      typeof freelancerId !== "string" ||
      !/^[a-f\d]{24}$/i.test(freelancerId)
    ) {
      return res.status(400).json({ error: "Valid campaignId and freelancerId are required" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (campaign.brandId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized to assign this campaign" });
    }

    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      return res.status(404).json({ error: "Freelancer not found" });
    }
    if (await Assignment.exists({ campaignId, freelancerId })) {
      return res.status(409).json({ error: "This freelancer is already assigned" });
    }

    const brand = await User.findById(req.user.userId);

    const assignment = new Assignment({
      campaignId,
      campaignName: campaign.name,
      freelancerId,
      freelancerName: freelancer.fullName,
      brandId: req.user.userId,
      brandName: brand.brandName || brand.orgName || brand.fullName,
      brief: brief && typeof brief === "object" ? brief : campaign.brief || {},
      dueDate: dueDate || campaign.date,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      compensation: typeof compensation === "string" ? compensation : "",
    });

    await assignment.save();

    // Update campaign stats
    campaign.submissionsTotal = (campaign.submissionsTotal || 0) + 1;
    if (campaign.status === "draft") campaign.status = "active";
    if (!campaign.creatorIds.some((id) => id.toString() === freelancerId)) {
      campaign.creatorIds.push(freelancerId);
    }
    await campaign.save();

    await notificationService.createAndDispatchNotification({
      recipientId: freelancerId,
      senderId: req.user.userId,
      type: "assignment_created",
      title: "New Assignment",
      message: `You have been assigned to campaign "${campaign.name || campaign.title || "New Campaign"}".`,
      link: "/freelancer",
      metadata: { assignmentId: assignment._id.toString(), campaignId: campaign._id.toString() },
    });

    res.status(201).json({ assignment, message: "Campaign assigned to freelancer" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This freelancer is already assigned" });
    }
    console.error("Assignment creation failed:", err.message);
    res.status(500).json({ error: "Could not assign freelancer" });
  }
});

// GET /api/assignments - list assignments
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "brand") {
      const assignments = await Assignment.find({ brandId: req.user.userId }).sort({ createdAt: -1 });
      return res.json({ assignments });
    } else if (req.user.role === "freelancer") {
      const assignments = await Assignment.find({ freelancerId: req.user.userId }).sort({ createdAt: -1 });
      return res.json({ assignments });
    }
    return res.status(403).json({ error: "Role not allowed" });
  } catch (err) {
    console.error("Assignment list failed:", err.message);
    res.status(500).json({ error: "Could not load assignments" });
  }
});

// GET /api/assignments/:id - get single assignment
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid assignment identifier" });
    }
    const filter =
      req.user.role === "brand"
        ? { _id: req.params.id, brandId: req.user.userId }
        : req.user.role === "freelancer"
          ? { _id: req.params.id, freelancerId: req.user.userId }
          : null;
    if (!filter) return res.status(403).json({ error: "Role not allowed" });
    const assignment = await Assignment.findOne(filter);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.json({ assignment });
  } catch (err) {
    console.error("Assignment lookup failed:", err.message);
    res.status(500).json({ error: "Could not load assignment" });
  }
});

// PUT /api/assignments/:id/status - update assignment status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (req.user.role !== "freelancer" || status !== "accepted") {
      return res.status(400).json({ error: "Freelancers may only accept assigned work" });
    }

    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid assignment identifier" });
    }
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      freelancerId: req.user.userId,
    });
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (assignment.status !== "assigned") {
      return res.status(409).json({ error: "This assignment cannot be accepted in its current state" });
    }

    assignment.status = status;
    await assignment.save();

    await notificationService.createAndDispatchNotification({
      recipientId: assignment.brandId,
      senderId: req.user.userId,
      type: "assignment_accepted",
      title: "Assignment Accepted",
      message: `${req.user.fullName || "Freelancer"} accepted the assignment for "${assignment.campaignName || "Campaign"}".`,
      link: "/brand/campaigns",
      metadata: { assignmentId: assignment._id.toString(), campaignId: assignment.campaignId.toString() },
    });

    res.json({ assignment, message: "Assignment status updated" });
  } catch (err) {
    console.error("Assignment status update failed:", err.message);
    res.status(500).json({ error: "Could not update assignment" });
  }
});

module.exports = router;