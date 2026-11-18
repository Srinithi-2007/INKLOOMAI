const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    objective: { type: String, required: true, trim: true },
    status: { type: String, enum: ["draft", "active", "completed"], default: "draft" },
    date: { type: String, required: true }, // ISO date string
    dateLabel: { type: String, enum: ["Ends", "Due", "Target"], default: "Due" },
    channels: [{ type: String }],
    creatorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brandName: { type: String, trim: true },
    brief: {
      contentRequirements: { type: String, default: "" },
      guidelines: { type: String, default: "" },
      aspectRatio: { type: String, enum: ["9:16", "1:1", "16:9"], default: "16:9" },
      audioGuidelines: { type: String, default: "" },
    },
    aiPass: { type: Number, default: 0 },
    submissionsDone: { type: Number, default: 0 },
    submissionsTotal: { type: Number, default: 0 },
    cover: { type: String, default: "" },
  },
  { timestamps: true }
);

campaignSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    return value;
  },
});
campaignSchema.index({ brandId: 1 });
campaignSchema.index({ status: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);