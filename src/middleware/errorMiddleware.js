const errorMiddleware = (err, req, res, next) => {
  console.error("ERROR:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: `Duplicate field value: ${Object.keys(err.keyValue).join(", ")}`,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server error",
  });
};

module.exports = errorMiddleware;