const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentBrand",
  new mongoose.Schema(
    {
      brandCode: String,
      brandName: { type: String, required: true },
      logo: String,
      description: String,
      status: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
  ),
);
