const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    format: { type: String, default: "" },
    attachedAssets: [
      {
        name: String,
        size: String,
        type: String,
        previewUrl: String,
        status: { type: String, enum: ["Ready", "Uploading", "Error"], default: "Ready" },
      },
    ],
    charCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    readingTimeSeconds: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "Draft",
        "AI Review Pending",
        "AI Review Completed",
        "Submitted for Brand Approval",
        "Revision Requested",
        "Resubmitted",
        "Approved",
        "Rejected",
      ],
      default: "Draft",
    },
    version: { type: String, default: "1.0" },
    previousContentSnapshot: { type: String, default: "" },
    contentSnapshot: { type: String, default: "" },
    feedback: {
      reviewerName: String,
      reviewerRole: String,
      reviewerAvatar: String,
      timestamp: String,
      note: String,
      suggestions: [String],
    },
    milestones: [
      {
        step: String,
        time: String,
        text: String,
        state: { type: String, enum: ["done", "current", "upcoming"], default: "upcoming" },
        alert: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

submissionSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    return value;
  },
});
submissionSchema.index({ assignmentId: 1 });
submissionSchema.index({ freelancerId: 1 });
submissionSchema.index({ brandId: 1 });
submissionSchema.index({ campaignId: 1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model("Submission", submissionSchema);