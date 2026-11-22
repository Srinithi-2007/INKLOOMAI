const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "assignment_created",
        "assignment_accepted",
        "submission_received",
        "revision_requested",
        "review_approved",
        "review_rejected",
        "system",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    recipientId: this.recipientId.toString(),
    senderId: this.senderId ? this.senderId.toString() : null,
    type: this.type,
    title: this.title,
    message: this.message,
    link: this.link,
    metadata: this.metadata,
    read: this.read,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Notification", notificationSchema);
