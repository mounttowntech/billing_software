const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentColor",
  new mongoose.Schema(
    {
      colorCode: String,
      colorName: { type: String, required: true },
      hexCode: String,
      status: Boolean,
    },
    { timestamps: true },
  ),
);
