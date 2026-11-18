const mongoose = require("mongoose");

const revisionSchema = new mongoose.Schema(
  {
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    note: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "resubmitted"], default: "open" },
    requestedAt: { type: Date, default: Date.now },
    resubmittedAt: { type: Date },
    updatedContent: { type: String, default: "" },
  },
  { timestamps: true }
);

revisionSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    return value;
  },
});
revisionSchema.index({ submissionId: 1 });
revisionSchema.index({ freelancerId: 1 });
revisionSchema.index({ brandId: 1 });
revisionSchema.index({ status: 1 });

module.exports = mongoose.model("Revision", revisionSchema);