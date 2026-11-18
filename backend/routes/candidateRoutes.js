const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate");
const User = require("../models/user");
const Election = require("../models/election");
const Vote = require("../models/vote");
const { jwtAuthMiddleware, generateToken } = require("../jwt");
const upload = require("../middleware/upload");
const uploadImage = require("../utils/uploadImage");
const deleteImage = require("../utils/deleteImage");

const candidateImageFields = [
  { name: "candidateImage", maxCount: 1 },
  { name: "partyImage", maxCount: 1 },
];

const checkAdminRole = async (userID) => {
  const user = await User.findById(userID);
  return Boolean(user && user.role === "admin");
};

async function uploadCandidateImages(files) {
  const images = {};
  const uploadedImages = [];

  try {
    for (const field of ["candidateImage", "partyImage"]) {
      const file = files?.[field]?.[0];
      if (!file) continue;

      const result = await uploadImage(file.buffer);
      const image = { url: result.secure_url, publicId: result.public_id };
      images[field] = image;
      uploadedImages.push(image);
    }

    return { images, uploadedImages };
  } catch (error) {
    await cleanUpImages(uploadedImages);
    throw error;
  }
}

async function cleanUpImages(images) {
  await Promise.all(
    images.map(async (image) => {
      try {
        await deleteImage(image.publicId);
      } catch (error) {
        console.error("Could not delete a candidate image:", error);
      }
    }),
  );
}

//post routes to add a candidate
router.post("/", jwtAuthMiddleware, upload.fields(candidateImageFields), async (req, res) => {
  let uploadedImages = [];
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "A valid JSON body is required" });
    }
    const { name, party, age } = req.body;

    if (
      typeof name !== "string" ||
      typeof party !== "string" ||
      !name.trim() ||
      !party.trim()
    ) {
      return res.status(400).json({
        message: "Candidate name and party are required.",
      });
    }

    const duplicateCandidate = await Candidate.findOne({
      name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      party: { $regex: `^${party.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (duplicateCandidate) {
      return res.status(409).json({
        message: "A candidate with the same name and party already exists.",
      });
    }

    const uploaded = await uploadCandidateImages(req.files);
    uploadedImages = uploaded.uploadedImages;
    const newCandidate = new Candidate({ name, party, age, ...uploaded.images });
    const response = await newCandidate.save();
    uploadedImages = [];

    res.status(200).json({
      response: response,
    });
  } catch (error) {
    await cleanUpImages(uploadedImages);
    console.error("Could not save candidate:", error);
    res.status(500).json({
      message: "Could not save the candidate.",
    });
  }
});

// put routes to update candidate
router.put("/:candidateID", jwtAuthMiddleware, upload.fields(candidateImageFields), async (req, res) => {
  let uploadedImages = [];
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
      return res.status(400).json({ error: "A valid JSON body is required" });

    const candidateID = req.params.candidateID; // Extract the ID from url parameter
    const { name, party, age } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (party !== undefined) updates.party = party;
    if (age !== undefined) updates.age = age;

    if (!mongoose.isValidObjectId(candidateID)) {
      return res.status(400).json({ error: "Invalid candidate ID" });
    }

    const imageFiles = ["candidateImage", "partyImage"].some(
      (field) => req.files?.[field]?.length,
    );
    if (Object.keys(updates).length === 0 && !imageFiles) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const [candidate, isInActiveElection, hasElectionVotes] = await Promise.all([
      Candidate.findById(candidateID).select("votes candidateImage partyImage"),
      Election.exists({ candidates: candidateID, status: "active" }),
      Vote.exists({ candidate: candidateID }),
    ]);
    if (!candidate) {
      return res.status(404).json({ err: "candidate not found" });
    }
    if (isInActiveElection || hasElectionVotes || candidate.votes.length > 0) {
      return res.status(409).json({
        message: "Candidates on active ballots or with voting history cannot be updated.",
      });
    }

    const uploaded = await uploadCandidateImages(req.files);
    uploadedImages = uploaded.uploadedImages;
    Object.assign(updates, uploaded.images);

    const response = await Candidate.findByIdAndUpdate(candidateID, updates, {
      returnDocument: "after",
      runValidators: true, // run mongoose valodation
    });
    if (!response) {
      return res.status(404).json({ err: "candidate not found" });
    }
    uploadedImages = [];
    const replacedImages = Object.keys(uploaded.images)
      .map((field) => candidate[field])
      .filter((image) => image?.publicId);
    await cleanUpImages(replacedImages);
    console.log("candidate updated");
    res.status(200).json({ response });
  } catch (error) {
    await cleanUpImages(uploadedImages);
    console.error("Could not update candidate:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

// delete routes to delete candidate
router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID; // Extract the ID from url parameter

    if (!mongoose.isValidObjectId(candidateID)) {
      return res.status(400).json({ error: "Invalid candidate ID" });
    }

    const isInElection = await Election.exists({ candidates: candidateID });
    const candidate = await Candidate.findById(candidateID).select("voteCount votes");
    if (isInElection || candidate?.voteCount > 0 || candidate?.votes.length > 0) {
      return res.status(409).json({
        message: "Candidates with election history cannot be deleted.",
      });
    }

    const response = await Candidate.findByIdAndDelete(candidateID);
    if (!response) {
      return res.status(404).json({ err: "candidate not found" });
    }
    await cleanUpImages(
      [response.candidateImage, response.partyImage].filter(
        (image) => image?.publicId,
      ),
    );
    console.log("candidate deleted");
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
});

router.post("/vote/:candidateID", (req, res) => {
  return res.status(410).json({
    message: "This endpoint is no longer supported. Vote through an active election.",
  });
});

// vote count
router.get("/vote/count", jwtAuthMiddleware, async (req, res) => {
  if (req.authenticatedUser.role !== "admin") {
    return res.status(403).json({ message: "Administrator access is required." });
  }

  try {
    const [candidates, voteCounts] = await Promise.all([
      Candidate.find().select("name party"),
      Vote.aggregate([
        { $group: { _id: "$candidate", count: { $sum: 1 } } },
      ]),
    ]);
    const countByCandidate = new Map(
      voteCounts.map((record) => [String(record._id), record.count]),
    );
    candidates.sort(
      (left, right) =>
        (countByCandidate.get(String(right._id)) || 0) -
        (countByCandidate.get(String(left._id)) || 0),
    );

    // Include the candidate ID so each vote count can be matched to a candidate.
    const voteRecord = candidates.map((data) => {
      return {
        candidateID: data._id,
        name: data.name,
        party: data.party,
        count: countByCandidate.get(String(data._id)) || 0,
      };
    });

    return res.status(200).json(voteRecord);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
});

// Get all candidates with their IDs for voting.
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find(
      {},
      "name party candidateImage partyImage",
    );

    // return the list of candidates
    res.status(200).json(candidates);
  } catch (err) {
    console.log(err);
    res.status(500).json({error: "internal server error"})
  }
});

module.exports = router;
