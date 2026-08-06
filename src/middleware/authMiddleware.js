exports.verifyToken = async (req, res, next) => {
  try {
    console.log("Authorization Header:", req.headers.authorization);

    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded:", decoded);

    const user = await User.findById(decoded.id).select("-password");

    console.log("User:", user);

    req.user = user;

    next();
  } catch (err) {
    console.log("JWT Error:", err);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};