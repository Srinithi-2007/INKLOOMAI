const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    platform: { type: String, default: "" },
    durationSec: { type: Number, default: 0 },
    auditScore: { type: Number, default: 0 },
    criticalRisk: { type: Number, default: 0 },
    toneDrift: { type: Number, default: 0 },
    factMatch: { type: Number, default: 0 },
    whisperConfidence: { type: Number, default: 0 },
    integrityScore: { type: Number, default: 0 },
    gateThreshold: { type: Number, default: 85 },
    aiResult: { type: mongoose.Schema.Types.Mixed },
    originalContent: { type: String, default: "" },
    sanitizedContent: { type: String, default: "" },
    hasDisclaimer: { type: Boolean, default: false },
    tamperAlerts: { type: Number, default: 0 },
    decision: { type: String, enum: ["pending", "approved", "revision", "rejected"], default: "pending" },
    escalatedToLegal: { type: Boolean, default: false },
    findings: [
      {
        id: String,
        title: String,
        rule: String,
        claim: String,
        suggestion: String,
        confidence: { type: Number, default: 0 },
        resolved: { type: Boolean, default: false },
        resolution: { type: String, enum: ["accepted", "rejected"], default: null },
      },
    ],
    toneFit: {
      label: String,
      detail: String,
      fit: { type: Number, default: 0 },
    },
    transcript: {
      before: String,
      flagged: String,
      after: String,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

reviewSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    return value;
  },
});
reviewSchema.index({ submissionId: 1 });
reviewSchema.index({ brandId: 1 });
reviewSchema.index({ freelancerId: 1 });
reviewSchema.index({ decision: 1 });

module.exports = mongoose.model("Review", reviewSchema);