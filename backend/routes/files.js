const express = require("express");
const multer = require("multer");
const Asset = require("../models/Asset");
const Assignment = require("../models/Assignment");
const Campaign = require("../models/Campaign");
const storageService = require("../services/storageService");
const { authMiddleware } = require("./auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: storageService.MAX_FILE_SIZE,
  },
});

// POST /api/files/upload - upload a file (authenticated users)
router.post("/upload", authMiddleware, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "File size exceeds the 10MB maximum limit.",
        });
      }
      return res.status(400).json({ error: err.message || "File upload error" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Key 'file' is required." });
      }

      const validation = storageService.validateFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const { category, campaignId, assignmentId, submissionId, name } = req.body || {};

      let resolvedBrandId = null;
      let resolvedCampaignId = null;
      let resolvedAssignmentId = null;

      if (req.user.role === "brand") {
        resolvedBrandId = req.user.userId;
        if (campaignId && /^[a-f\d]{24}$/i.test(campaignId)) {
          const campaign = await Campaign.findOne({ _id: campaignId, brandId: req.user.userId });
          if (campaign) {
            resolvedCampaignId = campaign._id;
          }
        }
      } else {
        // Freelancer
        if (assignmentId && /^[a-f\d]{24}$/i.test(assignmentId)) {
          const assignment = await Assignment.findOne({
            _id: assignmentId,
            freelancerId: req.user.userId,
          });
          if (assignment) {
            resolvedAssignmentId = assignment._id;
            resolvedCampaignId = assignment.campaignId;
            resolvedBrandId = assignment.brandId;
          }
        }
      }

      const saved = await storageService.saveFileBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const asset = new Asset({
        name: typeof name === "string" && name.trim() ? name.trim() : req.file.originalname,
        originalName: req.file.originalname,
        storageKey: saved.storageKey,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: saved.url,
        ownerId: req.user.userId,
        brandId: resolvedBrandId,
        campaignId: resolvedCampaignId,
        assignmentId: resolvedAssignmentId,
        submissionId: submissionId && /^[a-f\d]{24}$/i.test(submissionId) ? submissionId : null,
        category: ["brand_asset", "submission_attachment", "general"].includes(category)
          ? category
          : req.user.role === "brand"
            ? "brand_asset"
            : "submission_attachment",
      });

      await asset.save();

      return res.status(201).json({
        asset: asset.toPublicJSON(),
      });
    } catch (uploadError) {
      console.error("File upload failed:", uploadError);
      return res.status(500).json({ error: "Failed to process file upload" });
    }
  });
});

// GET /api/files - list assets accessible to current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, campaignId, assignmentId } = req.query;
    const filter = {};

    if (req.user.role === "brand") {
      filter.$or = [{ brandId: req.user.userId }, { ownerId: req.user.userId }];
    } else {
      // Freelancer sees files they own or files in assignments assigned to them
      filter.$or = [{ ownerId: req.user.userId }];
      const myAssignments = await Assignment.find({ freelancerId: req.user.userId }).select("_id campaignId");
      if (myAssignments.length > 0) {
        const assignmentIds = myAssignments.map((a) => a._id);
        const campaignIds = myAssignments.map((a) => a.campaignId);
        filter.$or.push({ assignmentId: { $in: assignmentIds } });
        filter.$or.push({ campaignId: { $in: campaignIds }, category: "brand_asset" });
      }
    }

    if (category && ["brand_asset", "submission_attachment", "general"].includes(category)) {
      filter.category = category;
    }
    if (campaignId && /^[a-f\d]{24}$/i.test(campaignId)) {
      filter.campaignId = campaignId;
    }
    if (assignmentId && /^[a-f\d]{24}$/i.test(assignmentId)) {
      filter.assignmentId = assignmentId;
    }

    const assets = await Asset.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({
      assets: assets.map((a) => a.toPublicJSON()),
    });
  } catch (listError) {
    console.error("Failed to list assets:", listError);
    return res.status(500).json({ error: "Failed to list assets" });
  }
});

// GET /api/files/provider-status - inspect storage configuration status
router.get("/provider-status", authMiddleware, (req, res) => {
  return res.json(storageService.getProviderStatus());
});

// GET /api/files/:id - get single asset metadata
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid asset ID format" });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Access control
    const isOwner = asset.ownerId.toString() === req.user.userId;
    const isBrand = asset.brandId && asset.brandId.toString() === req.user.userId;
    let isAssignedFreelancer = false;

    if (!isOwner && !isBrand && asset.assignmentId) {
      const assignment = await Assignment.findOne({
        _id: asset.assignmentId,
        freelancerId: req.user.userId,
      });
      if (assignment) isAssignedFreelancer = true;
    }

    if (!isOwner && !isBrand && !isAssignedFreelancer) {
      return res.status(403).json({ error: "Access denied to this asset" });
    }

    return res.json({ asset: asset.toPublicJSON() });
  } catch (getError) {
    console.error("Failed to retrieve asset:", getError);
    return res.status(500).json({ error: "Failed to retrieve asset" });
  }
});

// GET /api/files/download/:storageKey - download or view file content
router.get("/download/:storageKey", authMiddleware, async (req, res) => {
  try {
    const { storageKey } = req.params;
    const asset = await Asset.findOne({ storageKey });
    if (!asset) {
      return res.status(404).json({ error: "Asset record not found" });
    }

    // Authorization check
    const isOwner = asset.ownerId.toString() === req.user.userId;
    const isBrand = asset.brandId && asset.brandId.toString() === req.user.userId;
    let isAssigned = false;

    if (!isOwner && !isBrand && asset.assignmentId) {
      isAssigned = !!(await Assignment.exists({
        _id: asset.assignmentId,
        freelancerId: req.user.userId,
      }));
    }

    if (!isOwner && !isBrand && !isAssigned) {
      return res.status(403).json({ error: "Not authorized to access this file" });
    }

    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(asset.originalName)}"`
    );

    // 1. Check local file system
    const filePath = storageService.getFilePath(storageKey);
    if (filePath) {
      return res.sendFile(filePath);
    }

    // 2. Stream from cloud storage (Cloudinary / S3) with authorization enforced
    if (storageKey.startsWith("cld:") || (asset.url && asset.url.startsWith("http"))) {
      const https = require("https");
      return https
        .get(asset.url, (cloudRes) => {
          if (cloudRes.statusCode >= 400) {
            return res.status(cloudRes.statusCode).json({ error: "Failed to fetch file from cloud storage" });
          }
          cloudRes.pipe(res);
        })
        .on("error", (err) => {
          console.error("Cloud download stream error:", err.message);
          return res.status(502).json({ error: "Failed to stream from cloud storage" });
        });
    }

    return res.status(404).json({ error: "File not found on storage" });
  } catch (downloadErr) {
    console.error("Failed to download file:", downloadErr);
    return res.status(500).json({ error: "Failed to download file" });
  }
});

// DELETE /api/files/:id - delete asset (owner or brand only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid asset ID format" });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const isOwner = asset.ownerId.toString() === req.user.userId;
    const isBrand = asset.brandId && asset.brandId.toString() === req.user.userId;

    if (!isOwner && !isBrand) {
      return res.status(403).json({ error: "Only the file owner or brand admin can delete this asset" });
    }

    await storageService.deleteFile(asset.storageKey);
    await Asset.findByIdAndDelete(asset._id);

    return res.json({ success: true, message: "Asset deleted successfully" });
  } catch (deleteError) {
    console.error("Failed to delete asset:", deleteError);
    return res.status(500).json({ error: "Failed to delete asset" });
  }
});

module.exports = router;
