const express = require("express");
const mongoose = require("mongoose");
const Election = require("../models/election");
const Candidate = require("../models/candidate");
const User = require("../models/user");
const Vote = require("../models/vote");
const { jwtAuthMiddleware } = require("../jwt");

const router = express.Router();

function isAdmin(req) {
  return req.authenticatedUser.role === "admin";
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

async function getElectionResults(election) {
  const counts = await Vote.aggregate([
    { $match: { election: election._id } },
    { $group: { _id: "$candidate", count: { $sum: 1 } } },
  ]);
  const countByCandidate = new Map(
    counts.map((record) => [String(record._id), record.count]),
  );
  const candidates = await Candidate.find({
    _id: {
      $in: election.candidates.map((candidate) => candidate._id ?? candidate),
    },
  }).select("name party");

  return {
    totalVotes: counts.reduce((total, record) => total + record.count, 0),
    candidates: candidates.map((candidate) => ({
      candidateId: candidate._id,
      name: candidate.name,
      party: candidate.party,
      votes: countByCandidate.get(String(candidate._id)) || 0,
    })),
  };
}

router.use(jwtAuthMiddleware);

router.get("/", async (req, res) => {
  try {
    if (isAdmin(req)) {
      const elections = await Election.find()
        .populate("candidates", "name party candidateImage partyImage")
        .sort({ createdAt: -1 });
      const results = await Promise.all(
        elections.map(async (election) => ({
          ...election.toObject(),
          ...(await getElectionResults(election)),
        })),
      );
      return res.status(200).json(results);
    }

    const elections = await Election.find({ status: "active" })
      .populate("candidates", "name party candidateImage partyImage")
      .sort({ createdAt: -1 });
    const votes = await Vote.find({
      voter: req.authenticatedUser._id,
      election: { $in: elections.map((election) => election._id) },
    }).select("election");
    const votedElectionIds = new Set(votes.map((vote) => String(vote.election)));

    return res.status(200).json(
      elections.map((election) => ({
        _id: election._id,
        name: election.name,
        description: election.description,
        status: election.status,
        candidates: election.candidates,
        hasVoted: votedElectionIds.has(String(election._id)),
      })),
    );
  } catch (error) {
    console.error("Could not load elections:", error);
    return res.status(500).json({ message: "Could not load elections." });
  }
});

router.get("/my-votes", async (req, res) => {
  try {
    const [votes, legacyCandidates] = await Promise.all([
      Vote.find({
        voter: req.authenticatedUser._id,
        historyHidden: { $ne: true },
      })
        .sort({ votedAt: -1 })
        .select("electionName candidateName candidateParty votedAt"),
      Candidate.find({ "votes.user": req.authenticatedUser._id })
        .select("name party votes")
        .lean(),
    ]);
    const legacyVotes = legacyCandidates.flatMap((candidate) =>
      candidate.votes
        .filter(
          (vote) =>
            String(vote.user) === String(req.authenticatedUser._id) &&
            !vote.historyHidden,
        )
        .map((vote) => ({
          _id: vote._id,
          electionName: "Previous election",
          candidateName: candidate.name,
          candidateParty: candidate.party,
          votedAt: vote.votedAt,
        })),
    );
    return res.status(200).json(
      [...votes, ...legacyVotes].sort(
        (left, right) => new Date(right.votedAt) - new Date(left.votedAt),
      ),
    );
  } catch (error) {
    console.error("Could not load voting history:", error);
    return res.status(500).json({ message: "Could not load voting history." });
  }
});

router.delete("/my-votes/:voteId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.voteId)) {
    return res.status(400).json({ message: "Invalid vote history ID." });
  }

  try {
    const vote = await Vote.findOneAndUpdate(
      {
        _id: req.params.voteId,
        voter: req.authenticatedUser._id,
        historyHidden: { $ne: true },
      },
      { $set: { historyHidden: true } },
      { returnDocument: "after" },
    );
    if (vote) {
      return res.status(200).json({ message: "Vote hidden from your history." });
    }

    const legacyVote = await Candidate.updateOne(
      {
        votes: {
          $elemMatch: {
            _id: req.params.voteId,
            user: req.authenticatedUser._id,
            historyHidden: { $ne: true },
          },
        },
      },
      { $set: { "votes.$[vote].historyHidden": true } },
      {
        arrayFilters: [
          {
            "vote._id": req.params.voteId,
            "vote.user": req.authenticatedUser._id,
            "vote.historyHidden": { $ne: true },
          },
        ],
      },
    );
    if (!legacyVote.modifiedCount) {
      return res.status(404).json({ message: "Vote history entry not found." });
    }
    return res.status(200).json({ message: "Vote hidden from your history." });
  } catch (error) {
    console.error("Could not hide vote history:", error);
    return res.status(500).json({ message: "Could not hide vote history." });
  }
});

router.get("/published", async (req, res) => {
  if (isAdmin(req)) {
    return res.status(403).json({ message: "This endpoint is for voters." });
  }

  try {
    const elections = await Election.find({
      status: "stopped",
      resultsPublished: true,
    }).sort({ updatedAt: -1 });
    const publishedResults = await Promise.all(
      elections.map(async (election) => ({
        _id: election._id,
        name: election.name,
        description: election.description,
        ...(await getElectionResults(election)),
      })),
    );
    return res.status(200).json(publishedResults);
  } catch (error) {
    console.error("Could not load published results:", error);
    return res.status(500).json({ message: "Could not load published results." });
  }
});

router.post("/", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }

  const { name, description = "", candidateIds } = req.body || {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 120 ||
    typeof description !== "string" ||
    description.length > 1000 ||
    !Array.isArray(candidateIds) ||
    candidateIds.length === 0 ||
    candidateIds.some((id) => typeof id !== "string" || !validId(id))
  ) {
    return res.status(400).json({
      message: "Provide an election name and at least one valid candidate.",
    });
  }

  const uniqueCandidateIds = [...new Set(candidateIds.map(String))];
  if (uniqueCandidateIds.length !== candidateIds.length) {
    return res.status(400).json({ message: "Candidates must be unique." });
  }

  try {
    const candidateCount = await Candidate.countDocuments({
      _id: { $in: uniqueCandidateIds },
    });
    if (candidateCount !== uniqueCandidateIds.length) {
      return res.status(400).json({ message: "One or more candidates do not exist." });
    }

    const election = await Election.create({
      name: name.trim(),
      description: description.trim(),
      candidates: uniqueCandidateIds,
      createdBy: req.authenticatedUser._id,
    });
    await election.populate("candidates", "name party candidateImage partyImage");
    return res.status(201).json(election);
  } catch (error) {
    console.error("Could not create election:", error);
    return res.status(500).json({ message: "Could not create election." });
  }
});

router.delete("/:electionId", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  if (!validId(req.params.electionId)) {
    return res.status(400).json({ message: "Invalid election ID." });
  }

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const election = await Election.findById(req.params.electionId).session(session);
    if (!election) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Election not found." });
    }
    if (election.status === "active") {
      await session.abortTransaction();
      return res.status(409).json({
        message: "Stop the election before deleting its history.",
      });
    }

    await Vote.deleteMany({ election: election._id }, { session });
    await Election.deleteOne({ _id: election._id }, { session });
    await session.commitTransaction();
    return res.status(200).json({ message: "Election and its vote history deleted." });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Could not delete election history:", error);
    return res.status(500).json({ message: "Could not delete election history." });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

router.patch("/:electionId/status", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  if (!validId(req.params.electionId)) {
    return res.status(400).json({ message: "Invalid election ID." });
  }

  const { status } = req.body || {};
  if (!["active", "stopped"].includes(status)) {
    return res.status(400).json({ message: "Status must be active or stopped." });
  }

  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found." });
    }
    if (status === "active" && election.resultsPublished) {
      return res.status(409).json({
        message: "Published results cannot be reopened. Hide the results first.",
      });
    }

    election.status = status;
    await election.save();
    return res.status(200).json(election);
  } catch (error) {
    console.error("Could not update election status:", error);
    return res.status(500).json({ message: "Could not update election status." });
  }
});

router.patch("/:electionId/results", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  if (!validId(req.params.electionId)) {
    return res.status(400).json({ message: "Invalid election ID." });
  }

  const { published } = req.body || {};
  if (typeof published !== "boolean") {
    return res.status(400).json({ message: "Published must be true or false." });
  }

  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found." });
    }
    if (published && election.status !== "stopped") {
      return res.status(409).json({
        message: "Stop the election before publishing its results.",
      });
    }

    election.resultsPublished = published;
    await election.save();
    return res.status(200).json(election);
  } catch (error) {
    console.error("Could not update result visibility:", error);
    return res.status(500).json({ message: "Could not update result visibility." });
  }
});

router.get("/:electionId/progress", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  if (!validId(req.params.electionId)) {
    return res.status(400).json({ message: "Invalid election ID." });
  }

  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found." });
    }

    const [results, registeredVoters] = await Promise.all([
      getElectionResults(election),
      User.countDocuments({ role: "voter" }),
    ]);
    return res.status(200).json({
      ...results,
      registeredVoters,
      turnoutPercent: registeredVoters
        ? Number(((results.totalVotes / registeredVoters) * 100).toFixed(1))
        : 0,
    });
  } catch (error) {
    console.error("Could not load election progress:", error);
    return res.status(500).json({ message: "Could not load election progress." });
  }
});

router.get("/:electionId/party-statistics", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  if (!validId(req.params.electionId)) {
    return res.status(400).json({ message: "Invalid election ID." });
  }

  try {
    const election = await Election.findById(req.params.electionId).select(
      "_id candidates",
    );
    if (!election) {
      return res.status(404).json({ message: "Election not found." });
    }

    const partyStatistics = await Candidate.aggregate([
      {
        $match: {
          _id: {
            $in: election.candidates.map((candidate) => candidate._id ?? candidate),
          },
        },
      },
      {
        $group: {
          _id: {
            $let: {
              vars: {
                partyName: {
                  $trim: { input: { $ifNull: ["$party", ""] } },
                },
              },
              in: {
                $cond: [
                  { $eq: ["$$partyName", ""] },
                  "Independent",
                  "$$partyName",
                ],
              },
            },
          },
          candidateIds: { $push: "$_id" },
        },
      },
      {
        $lookup: {
          from: Vote.collection.name,
          let: {
            candidateIds: "$candidateIds",
            electionId: election._id,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$election", "$$electionId"] },
                    { $in: ["$candidate", "$$candidateIds"] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "voteCounts",
        },
      },
      {
        $project: {
          _id: 0,
          party: "$_id",
          totalVotes: {
            $ifNull: [{ $arrayElemAt: ["$voteCounts.count", 0] }, 0],
          },
        },
      },
      { $sort: { totalVotes: -1, party: 1 } },
    ]);

    return res.status(200).json(partyStatistics);
  } catch (error) {
    console.error("Could not load party vote statistics:", error);
    return res.status(500).json({
      message: "Could not load party vote statistics.",
    });
  }
});

router.post("/:electionId/votes", async (req, res) => {
  if (isAdmin(req)) {
    return res.status(403).json({ message: "Administrators cannot vote." });
  }
  if (!validId(req.params.electionId) || !validId(req.body?.candidateId)) {
    return res.status(400).json({ message: "A valid election and candidate are required." });
  }

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const election = await Election.findOne({
      _id: req.params.electionId,
      status: "active",
      candidates: req.body.candidateId,
    }).session(session);
    if (!election) {
      await session.abortTransaction();
      return res.status(409).json({
        message: "This election is not active or the candidate is not on its ballot.",
      });
    }

    const candidate = await Candidate.findById(req.body.candidateId).session(session);
    if (!candidate) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Candidate not found." });
    }

    const [vote] = await Vote.create(
      [
        {
          election: election._id,
          voter: req.authenticatedUser._id,
          candidate: req.body.candidateId,
          electionName: election.name,
          candidateName: candidate.name,
          candidateParty: candidate.party,
        },
      ],
      { session },
    );

    req.authenticatedUser.isVoted = true;
    await req.authenticatedUser.save({ session });
    await session.commitTransaction();
    return res.status(201).json({
      message: "Your vote has been recorded.",
      votedAt: vote.votedAt,
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already voted in this election.",
      });
    }
    console.error("Could not record vote:", error);
    return res.status(500).json({ message: "Could not record your vote." });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

module.exports = router;
