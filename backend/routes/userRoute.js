const express = require("express");
const router = express.Router();
const User = require("../models/user");
const upload = require("../middleware/upload");
const uploadImage = require("../utils/uploadImage");
const deleteImage = require("../utils/deleteImage");
const { jwtAuthMiddleware, generateToken } = require("../jwt");
const generateOTP = require("../utils/otp");
const hashOTP = require("../utils/hashOtp");
const sendOTPEmail = require("../utils/sendEmail");

//post routes to add a user
router.post("/signup", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "A valid JSON body is required" });
    }
    const data = req.body;
    if (
      typeof data.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    ) {
      return res.status(400).json({
        error: "A valid email address is required",
      });
    }

    const age =
      typeof data.age === "number"
        ? data.age
        : typeof data.age === "string" && data.age.trim()
          ? Number(data.age)
          : NaN;
    if (
      typeof data.name !== "string" ||
      !data.name.trim() ||
      !Number.isInteger(age) ||
      age <= 0 ||
      typeof data.address !== "string" ||
      !data.address.trim() ||
      typeof data.password !== "string" ||
      !data.password.trim()
    ) {
      return res.status(400).json({
        error: "Name, positive integer age, address, and password are required",
      });
    }

    // check if there is already an admin

    // const adminUser = await User.findOne({role: "admin"})
    if (data.role === "admin") {
      return res.status(403).json({
        error: "Admin role cannot be assigned through public signup",
      });
    }

    //valodate aadhar card number must have exactly 12 digits
    if (
      typeof data.aadharCardNumber !== "string" ||
      !/^\d{12}$/.test(data.aadharCardNumber)
    ) {
      return res
        .status(400)
        .json({ error: "aadhar card number must be exactly 12 digits" });
    }

    // check if a user with same aadhar card numberalready exist
    const existingUser = await User.findOne({
      aadharCardNumber: data.aadharCardNumber,
    });
    if (existingUser) {
      return res.status(400).json({
        error: "user with the same aadhar card number already exists",
      });
    }
    const existingEmail = await User.findOne({
      email: data.email.trim().toLowerCase(),
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "This email is already registered",
      });
    }

    const otp = generateOTP();

    const hashedOTP = hashOTP(otp);

    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    // creating a new userdocument using the mongoose model

    const newUser = new User({
      name: data.name,
      age,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
      aadharCardNumber: data.aadharCardNumber,
      password: data.password,
      role: "voter",
      isEmailVerified: false,
      emailVerificationOTP: hashedOTP,
      emailVerificationOTPExpires: otpExpires,
    });

    const response = await newUser.save();

    // Send OTP to user's email
    await sendOTPEmail(response.email, otp);

    const safeUser = response.toObject();

    delete safeUser.password;
    delete safeUser.emailVerificationOTP;
    delete safeUser.emailVerificationOTPExpires;

    res.status(201).json({
      message:
        "Registration successful. Please verify your email using the OTP sent to your email.",
      response: safeUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "User with this Aadhaar number already exists",
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: "Invalid user data" });
    }

    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//verify-email route

router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+emailVerificationOTP +emailVerificationOTPExpires");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        error: "Email is already verified",
      });
    }

    if (
      !user.emailVerificationOTP ||
      !user.emailVerificationOTPExpires ||
      user.emailVerificationOTPExpires < new Date()
    ) {
      return res.status(400).json({
        error: "OTP is invalid or expired",
      });
    }

    const hashedOTP = hashOTP(otp.toString());

    if (hashedOTP !== user.emailVerificationOTP) {
      return res.status(400).json({
        error: "Invalid OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;

    await user.save();

    const payload = {
      id: user.id,
    };

    const token = generateToken(payload);

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.emailVerificationOTP;
    delete safeUser.emailVerificationOTPExpires;

    res.status(200).json({
      message: "Email verified successfully",
      response: safeUser,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// forgot password route

router.post("/forgot-password", async (req, res) => {
  try {
    const { aadharCardNumber } = req.body;

    if (
      typeof aadharCardNumber !== "string" ||
      !/^\d{12}$/.test(aadharCardNumber)
    ) {
      return res.status(400).json({
        error: "Valid Aadhaar card number is required",
      });
    }

    const user = await User.findOne({
      aadharCardNumber,
      isEmailVerified: true,
    }).select(
      "+passwordResetOTP +passwordResetOTPExpires +passwordResetOTPAttempts"
    );

    if (!user) {
      return res.status(200).json({
        message: "If an eligible account exists, a password reset OTP will be sent to its registered email.",
      });
    }

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    user.passwordResetOTP = hashedOTP;
    user.passwordResetOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.passwordResetOTPAttempts = 0;

    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      message: "If an eligible account exists, a password reset OTP will be sent to its registered email.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// reset password route

router.post("/reset-password", async (req, res) => {
  try {
    const { aadharCardNumber, otp, newPassword } = req.body;

    if (
      typeof aadharCardNumber !== "string" ||
      !/^\d{12}$/.test(aadharCardNumber) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp) ||
      typeof newPassword !== "string" ||
      !newPassword.trim()
    ) {
      return res.status(400).json({
        error: "Valid Aadhaar, OTP and new password are required",
      });
    }

    const user = await User.findOne({
      aadharCardNumber,
      isEmailVerified: true,
    }).select(
      "+passwordResetOTP +passwordResetOTPExpires +passwordResetOTPAttempts"
    );

    if (!user || !user.passwordResetOTP) {
      return res.status(400).json({
        error: "Invalid or expired OTP",
      });
    }

    if (user.passwordResetOTPExpires < new Date()) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      user.passwordResetOTPAttempts = 0;
      await user.save();

      return res.status(400).json({
        error: "OTP has expired. Please request a new OTP",
      });
    }

    if (user.passwordResetOTPAttempts >= 5) {
      return res.status(429).json({
        error: "Too many attempts. Please request a new OTP",
      });
    }

    const hashedOTP = hashOTP(otp);

    if (hashedOTP !== user.passwordResetOTP) {
      user.passwordResetOTPAttempts += 1;
      await user.save();

      return res.status(400).json({
        error: "Invalid OTP",
      });
    }

    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetOTPAttempts = 0;

    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// login routes

router.post("/login", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "A valid JSON body is required" });
    }
    //Extract aadharCardNumber and password from request body
    const { aadharCardNumber, password } = req.body;

    // check if aadharCardNumber or password is missing
    if (!aadharCardNumber || !password) {
      return res
        .status(400)
        .json({ error: "Aadhar card number and password are required" });
    }

    // Find the user by aadharCardNumber
    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    // if user does not exist or password does not match, return error
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "invalid username or password" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "This account has been blocked" });
    }

    //generate token
    const payload = {
      id: user.id,
    };
    const token = generateToken(payload);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// profile routes
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userdata = req.user;
    const userId = userdata.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", jwtAuthMiddleware, async (req, res) => {
  const { name, mobile, address, email } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof mobile !== "string" ||
    typeof address !== "string" ||
    !address.trim() ||
    typeof email !== "string" ||
    (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
  ) {
    return res.status(400).json({
      error: "Enter a valid name, mobile number, address, and email",
    });
  }

  try {
    const user = req.authenticatedUser;
    user.name = name.trim();
    user.mobile = mobile.trim();
    user.address = address.trim();
    user.email = email.trim();
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: "Invalid profile data" });
    }

    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Could not update your profile" });
  }
});

router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extract the id from token
    const { currentPassword, newPassword } = req.body; // Extract current and new password from req.body

    // check currentPassword and newPassword are present in the request body
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both currentPassword and newPassword are required" });
    }
    // find the user by userid
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // if password does not match return error
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    //update the user password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "password updated" });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
});

router.post(
  "/profile-image",
  jwtAuthMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Please select an image" });
      }

      const user = req.authenticatedUser;

      const oldPublicId = user.profileImage?.publicId;

      const result = await uploadImage(req.file.buffer);

      user.profileImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      await user.save();

      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }

      res.status(200).json({
        message: "Profile image uploaded successfully",
        profileImage: user.profileImage,
      });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Image upload failed" });
    }
  },
);

router.delete("/profile-image", jwtAuthMiddleware, async (req, res) => {
  try {
    const user = req.authenticatedUser;

    if (!user.profileImage?.publicId) {
      return res.status(404).json({
        error: "No profile image found",
      });
    }

    const publicId = user.profileImage.publicId;

    await deleteImage(publicId);

    user.profileImage = undefined;
    await user.save();

    res.status(200).json({
      message: "Profile image deleted successfully",
    });
  } catch (error) {
    console.error("Profile image delete error:", error);

    res.status(500).json({
      error: "Failed to delete profile image",
    });
  }
});

module.exports = router;
