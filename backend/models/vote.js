const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true,
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  electionName: {
    type: String,
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  candidateParty: {
    type: String,
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
});

voteSchema.index({ election: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
