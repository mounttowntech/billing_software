const jwt = require("jsonwebtoken");
const User = require("../model/User");


exports.verifyToken = async (req, res, next) => {
  try {

    console.log(
      "Authorization Header:",
      req.headers.authorization
    );


    let token;


    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }


    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      });
    }


    console.log("Token:", token);


    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    console.log(
      "Decoded Token:",
      decoded
    );


    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role");


    console.log(
      "User from DB:",
      user
    );


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }


    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account inactive"
      });
    }


    req.user = user;


    next();


  } catch (err) {

    console.log(
      "JWT Error:",
      err.message
    );


    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });

  }
};