const express = require("express");
const app = express();
require("dotenv").config();
const multer = require("multer");
const cors = require("cors");
const port = process.env.PORT || 3000;
const connectDB = require("./config/db");
// const path = require("path");

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json());

const userRoutes = require("./routes/userRoute");
const candidateRoutes = require("./routes/candidateRoutes");
const electionRoutes = require("./routes/electionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
app.use("/user", userRoutes);
app.use("/candidate", candidateRoutes);
app.use("/elections", electionRoutes);
app.use("/admin", adminRoutes);
app.use("/ai", aiRoutes);
app.use("/complaints", complaintRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.message,
    });
  }

  if (err.message === "Only image files are allowed") {
    return res.status(400).json({
      error: err.message,
    });
  }

  res.status(500).json({
    error: "Internal server error",
  });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is successfully listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });
