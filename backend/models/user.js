const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//define the user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationOTP: {
    type: String,
    select: false,
  },
  emailVerificationOTPExpires: {
    type: Date,
    select: false,
  },
  passwordResetOTP: {
    type: String,
    select: false,
  },
  passwordResetOTPExpires: {
    type: Date,
    select: false,
  },
  passwordResetOTPAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  mobile: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  aadharCardNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{12}$/,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["voter", "admin"],
    default: "voter",
  },
  isVoted: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
  },
});

userSchema.pre("save", async function () {
  const user = this;

  //hash the password only if it has been modified (or is new)
  if (!user.isModified("password")) return;

  try {
    // hash password generation
    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(user.password, salt);

    // override the plain password with the hashed one
    user.password = hashPassword;
  } catch (error) {
    throw error;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
