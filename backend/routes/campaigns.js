const express = require("express");
const router = express.Router();
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const { authMiddleware, requireRole } = require("./auth");

// GET /api/campaigns - list campaigns (brand sees own, freelancer sees assigned)
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "brand") {
      const campaigns = await Campaign.find({ brandId: req.user.userId }).sort({ createdAt: -1 });
      return res.json({ campaigns });
    } else if (req.user.role === "freelancer") {
      const Assignment = require("../models/Assignment");
      const assignments = await Assignment.find({ freelancerId: req.user.userId }).distinct("campaignId");
      const campaigns = await Campaign.find({ _id: { $in: assignments } }).sort({ createdAt: -1 });
      return res.json({ campaigns });
    }
    return res.status(403).json({ error: "Role not allowed" });
  } catch (err) {
    console.error("Campaign list failed:", err.message);
    res.status(500).json({ error: "Could not load campaigns" });
  }
});

// GET /api/campaigns/:id - get single campaign
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid campaign identifier" });
    }
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (req.user.role === "brand" && campaign.brandId.toString() !== req.user.userId) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (req.user.role === "freelancer") {
      const Assignment = require("../models/Assignment");
      const assigned = await Assignment.exists({
        campaignId: campaign._id,
        freelancerId: req.user.userId,
      });
      if (!assigned) return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ campaign });
  } catch (err) {
    console.error("Campaign lookup failed:", err.message);
    res.status(500).json({ error: "Could not load campaign" });
  }
});

// POST /api/campaigns - create campaign (brand only)
router.post("/", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const { name, objective, date, dateLabel, channels, brief, cover } = req.body || {};

    if (
      typeof name !== "string" || !name.trim() || name.length > 160 ||
      typeof objective !== "string" || !objective.trim() || objective.length > 4000 ||
      typeof date !== "string" || Number.isNaN(Date.parse(date)) ||
      (channels !== undefined && (!Array.isArray(channels) || channels.some((item) => typeof item !== "string")))
    ) {
      return res.status(400).json({ error: "Missing required fields: name, objective, date" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "Brand user not found" });
    }

    const campaign = new Campaign({
      name,
      objective: objective.trim(),
      status: "draft",
      date,
      dateLabel: dateLabel || "Due",
      channels: channels || [],
      brandId: req.user.userId,
      brandName: user.brandName || user.orgName || user.fullName,
      brief: brief || {},
      cover: cover || "",
    });

    await campaign.save();
    res.status(201).json({ campaign, message: "Campaign created successfully" });
  } catch (err) {
    console.error("Campaign creation failed:", err.message);
    res.status(500).json({ error: "Could not create campaign" });
  }
});

// PUT /api/campaigns/:id - update campaign (brand only)
router.put("/:id", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const allowed = ["name", "objective", "date", "dateLabel", "channels", "brief", "cover"];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowed.includes(key))
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No editable campaign fields provided" });
    }
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, brandId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found or not authorized" });
    }
    res.json({ campaign, message: "Campaign updated" });
  } catch (err) {
    console.error("Campaign update failed:", err.message);
    res.status(500).json({ error: "Could not update campaign" });
  }
});

// DELETE /api/campaigns/:id - delete campaign (brand only)
router.delete("/:id", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid campaign identifier" });
    }
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      brandId: req.user.userId,
    });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    const Assignment = require("../models/Assignment");
    if (await Assignment.exists({ campaignId: req.params.id })) {
      return res.status(409).json({
        error: "Campaigns with assignments cannot be deleted.",
      });
    }
    await campaign.deleteOne();
    res.json({ message: "Campaign deleted" });
  } catch (err) {
    console.error("Campaign deletion failed:", err.message);
    res.status(500).json({ error: "Could not delete campaign" });
  }
});

module.exports = router;