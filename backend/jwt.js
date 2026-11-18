const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("./models/user");

const jwtAuthMiddleware = async (req, res, next) => {
  //   const authorization = req.headers.authorization;
  //   if (!authorization)
  //     return res.status(400).json({ error: " token not found" });
  //   const token = req.headers.authorization.split(" ")[1];

  const authorization = req.get("authorization") || "";
  const parts = authorization.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
    return res.status(401).json({ error: "Bearer token required" });
  }

  const token = parts[1];

//   if (!token) return res.status(401).json({ error: "Unauthorized" });

  let decode;
  try {
    decode = jwt.verify(token, process.env.JWT_SECERET);
  } catch {
    return res.status(401).json({ error: "Invalid Token" });
  }

  try {
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(401).json({ error: "User session is no longer valid" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "This account has been blocked" });
    }

    req.user = decode;
    req.authenticatedUser = user;
    return next();
  } catch (error) {
    console.error("Could not validate authenticated user:", error);
    return res.status(500).json({ error: "Could not validate your session" });
  }
};

// function to generate the jwt token

const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECERET, {
    expiresIn: "1h",
  });
};

module.exports = { jwtAuthMiddleware, generateToken };
