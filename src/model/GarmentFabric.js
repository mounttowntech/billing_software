const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentFabric",
  new mongoose.Schema(
    {
      fabricCode: String,
      fabricName: { type: String, required: true },
      description: String,
      status: Boolean,
    },
    { timestamps: true },
  ),
);
