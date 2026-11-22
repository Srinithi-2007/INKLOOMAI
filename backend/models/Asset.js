const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    url: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", index: true },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", index: true },
    category: {
      type: String,
      enum: ["brand_asset", "submission_attachment", "general"],
      default: "general",
      index: true,
    },
  },
  { timestamps: true }
);

assetSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    originalName: this.originalName,
    storageKey: this.storageKey,
    mimeType: this.mimeType,
    size: this.size,
    url: this.url,
    ownerId: this.ownerId ? this.ownerId.toString() : null,
    brandId: this.brandId ? this.brandId.toString() : null,
    campaignId: this.campaignId ? this.campaignId.toString() : null,
    assignmentId: this.assignmentId ? this.assignmentId.toString() : null,
    submissionId: this.submissionId ? this.submissionId.toString() : null,
    category: this.category,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Asset", assetSchema);
