const jwt = require("jsonwebtoken");
const User = require("../model/User");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    const user = await User.findById(decoded.id).select("password status");
    console.log("User from DB:", user);

    if (!user || !user.status || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
