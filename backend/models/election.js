const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "active", "stopped"],
      default: "draft",
    },
    resultsPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Election", electionSchema);
