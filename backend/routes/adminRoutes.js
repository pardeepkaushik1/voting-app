const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const Vote = require("../models/vote");
const Candidate = require("../models/candidate");
const { jwtAuthMiddleware } = require("../jwt");

const router = express.Router();

router.use(jwtAuthMiddleware);
router.use((req, res, next) => {
  if (req.authenticatedUser.role !== "admin") {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  return next();
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email mobile role isVoted isBlocked")
      .lean();
    users.sort((left, right) => {
      const currentAdminFirst =
        Number(String(left._id) !== String(req.authenticatedUser._id)) -
        Number(String(right._id) !== String(req.authenticatedUser._id));
      if (currentAdminFirst !== 0) return currentAdminFirst;

      const adminsFirst =
        Number(left.role !== "admin") - Number(right.role !== "admin");
      return adminsFirst || left.name.localeCompare(right.name);
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Could not load registered users:", error);
    return res.status(500).json({ message: "Could not load registered users." });
  }
});

router.patch("/users/:userId/block", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }
  if (typeof req.body?.blocked !== "boolean") {
    return res.status(400).json({ message: "Blocked must be true or false." });
  }
  if (String(req.authenticatedUser._id) === req.params.userId) {
    return res.status(400).json({ message: "You cannot block your own account." });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Administrator accounts cannot be blocked." });
    }

    user.isBlocked = req.body.blocked;
    await user.save();
    return res.status(200).json({
      _id: user._id,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error("Could not update user status:", error);
    return res.status(500).json({ message: "Could not update user status." });
  }
});

router.delete("/users/:userId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }
  if (String(req.authenticatedUser._id) === req.params.userId) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  let session;
  let failure;

  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const user = await User.findById(req.params.userId).session(session);
      if (!user) {
        failure = { status: 404, message: "User not found." };
        return;
      }
      if (user.role === "admin") {
        failure = {
          status: 403,
          message: "Administrator accounts cannot be deleted.",
        };
        return;
      }

      await Vote.deleteMany({ voter: user._id }, { session });

      const candidates = await Candidate.find({ "votes.user": user._id })
        .select("votes voteCount")
        .session(session);
      for (const candidate of candidates) {
        candidate.votes = candidate.votes.filter(
          (vote) => String(vote.user) !== String(user._id),
        );
        candidate.voteCount = candidate.votes.length;
        await candidate.save({ session });
      }

      await User.deleteOne({ _id: user._id }, { session });
    });

    if (failure) {
      return res.status(failure.status).json({ message: failure.message });
    }

    return res.status(200).json({ message: "User and voting data deleted." });
  } catch (error) {
    console.error("Could not delete user and voting data:", error);
    return res.status(500).json({ message: "Could not delete the user." });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

module.exports = router;
