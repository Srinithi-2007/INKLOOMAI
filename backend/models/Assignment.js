const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    campaignName: { type: String, required: true, trim: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancerName: { type: String, required: true, trim: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brandName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["assigned", "accepted", "in-draft", "ai-review", "submitted", "revision-requested", "resubmitted", "approved", "rejected"],
      default: "assigned",
    },
    brief: {
      contentRequirements: { type: String, default: "" },
      guidelines: { type: String, default: "" },
      aspectRatio: { type: String, default: "" },
      audioGuidelines: { type: String, default: "" },
    },
    dueDate: { type: String },
    deliverables: [{ type: String }],
    compensation: { type: String, default: "" },
  },
  { timestamps: true }
);

assignmentSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    return value;
  },
});
assignmentSchema.index({ freelancerId: 1 });
assignmentSchema.index({ brandId: 1 });
assignmentSchema.index({ campaignId: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ campaignId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.model("Assignment", assignmentSchema);