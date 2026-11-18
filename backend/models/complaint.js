const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    adminReply: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Complaint", complaintSchema);
