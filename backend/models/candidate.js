const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  party: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  candidateImage: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
  },
  partyImage: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
  },
  votes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      votedAt: {
        type: Date,
        default: Date.now,
      },
      historyHidden: {
        type: Boolean,
        default: false,
      },
    },
  ],
  voteCount: {
    type: Number,
    default: 0,
  },
});

const Candidate = mongoose.model("Candidate", candidateSchema);
module.exports = Candidate;
