const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, requireRole } = require("./auth");

// All brand DNA routes strictly require brand role
router.use(authMiddleware, requireRole("brand"));

// GET /api/brand/dna - Get Brand DNA settings for authenticated brand admin
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "Brand profile not found" });
    }

    res.json({
      success: true,
      brandDna: {
        brandName: user.brandName || "",
        orgName: user.orgName || "",
        industry: user.industry || "",
        website: user.website || "",
        about: user.about || "",
        brandVoice: user.brandVoice || "",
        corePillars: user.corePillars || [],
        preferredTerms: user.preferredTerms || [],
        bannedTerms: user.bannedTerms || [],
        approvedClaims: user.approvedClaims || [],
        visualGuidelines: user.visualGuidelines || "",
        platformRules: user.platformRules || {},
        additionalRules: user.additionalRules || [],
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Failed to fetch Brand DNA:", err.message);
    res.status(500).json({ error: "Could not retrieve Brand DNA settings" });
  }
});

// PUT /api/brand/dna - Update Brand DNA settings with validation
router.put("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "Brand profile not found" });
    }

    const {
      brandName,
      orgName,
      industry,
      website,
      about,
      brandVoice,
      corePillars,
      preferredTerms,
      bannedTerms,
      approvedClaims,
      visualGuidelines,
      platformRules,
      additionalRules,
    } = req.body || {};

    // Validation
    if (brandName !== undefined) {
      if (typeof brandName !== "string" || brandName.trim().length > 150) {
        return res.status(400).json({ error: "Brand name must be a valid string under 150 characters" });
      }
      user.brandName = brandName.trim();
    }

    if (orgName !== undefined) user.orgName = typeof orgName === "string" ? orgName.trim() : "";
    if (industry !== undefined) user.industry = typeof industry === "string" ? industry.trim() : "";
    if (website !== undefined) user.website = typeof website === "string" ? website.trim() : "";
    if (about !== undefined) user.about = typeof about === "string" ? about.trim() : "";
    if (brandVoice !== undefined) user.brandVoice = typeof brandVoice === "string" ? brandVoice.trim() : "";
    if (visualGuidelines !== undefined) user.visualGuidelines = typeof visualGuidelines === "string" ? visualGuidelines.trim() : "";

    const cleanStringArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim().slice(0, 300));
    };

    if (corePillars !== undefined) user.corePillars = cleanStringArray(corePillars);
    if (preferredTerms !== undefined) user.preferredTerms = cleanStringArray(preferredTerms);
    if (bannedTerms !== undefined) user.bannedTerms = cleanStringArray(bannedTerms);
    if (approvedClaims !== undefined) user.approvedClaims = cleanStringArray(approvedClaims);
    if (additionalRules !== undefined) user.additionalRules = cleanStringArray(additionalRules);

    if (platformRules !== undefined) {
      if (typeof platformRules === "object" && platformRules !== null && !Array.isArray(platformRules)) {
        user.platformRules = platformRules;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Brand DNA settings updated successfully",
      brandDna: {
        brandName: user.brandName,
        orgName: user.orgName,
        industry: user.industry,
        website: user.website,
        about: user.about,
        brandVoice: user.brandVoice,
        corePillars: user.corePillars,
        preferredTerms: user.preferredTerms,
        bannedTerms: user.bannedTerms,
        approvedClaims: user.approvedClaims,
        visualGuidelines: user.visualGuidelines,
        platformRules: user.platformRules,
        additionalRules: user.additionalRules,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Failed to update Brand DNA:", err.message);
    res.status(500).json({ error: "Could not save Brand DNA settings" });
  }
});

module.exports = router;
