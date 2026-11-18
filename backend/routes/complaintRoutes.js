const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/complaint");
const { jwtAuthMiddleware } = require("../jwt");

const router = express.Router();

router.use(jwtAuthMiddleware);

function isAdmin(req) {
  return req.authenticatedUser.role === "admin";
}

router.post("/", async (req, res) => {
  const { subject, message } = req.body || {};
  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    subject.trim().length > 120 ||
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 3000
  ) {
    return res.status(400).json({
      message: "Please enter a subject and describe your complaint.",
    });
  }

  try {
    let complaint;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        complaint = await Complaint.create({
          trackingId: `CMP-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
          submittedBy: req.authenticatedUser._id,
          subject: subject.trim(),
          message: message.trim(),
        });
        break;
      } catch (error) {
        if (error.code !== 11000 || attempt === 2) throw error;
      }
    }

    return res.status(201).json({
      trackingId: complaint.trackingId,
      complaint,
    });
  } catch (error) {
    console.error("Could not submit complaint:", error);
    return res.status(500).json({ message: "Could not submit your complaint." });
  }
});

router.get("/mine", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      submittedBy: req.authenticatedUser._id,
    }).sort({ createdAt: -1 });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error("Could not load user complaints:", error);
    return res.status(500).json({ message: "Could not load complaints." });
  }
});

router.get("/admin", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }

  try {
    const complaints = await Complaint.find()
      .populate("submittedBy", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error("Could not load complaints for administration:", error);
    return res.status(500).json({ message: "Could not load complaints." });
  }
});

router.patch("/admin/:complaintId", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  if (!mongoose.isValidObjectId(req.params.complaintId)) {
    return res.status(400).json({ message: "Invalid complaint ID." });
  }

  const { adminReply, status } = req.body || {};
  const updates = {};
  if (adminReply !== undefined) {
    if (typeof adminReply !== "string" || adminReply.trim().length > 3000) {
      return res.status(400).json({ message: "Reply is too long." });
    }
    updates.adminReply = adminReply.trim();
  }
  if (status !== undefined) {
    if (!["pending", "resolved"].includes(status)) {
      return res.status(400).json({
        message: "The status must be pending or resolved.",
      });
    }
    updates.status = status;
    updates.resolvedAt = status === "resolved" ? new Date() : null;
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "Provide a reply or status to update." });
  }

  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.complaintId,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    ).populate("submittedBy", "name email");
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }
    return res.status(200).json(complaint);
  } catch (error) {
    console.error("Could not update complaint:", error);
    return res.status(500).json({ message: "Could not update the complaint." });
  }
});

module.exports = router;
