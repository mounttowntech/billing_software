const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentCategory",
  new mongoose.Schema(
    {
      categoryCode: String,
      categoryName: { type: String, required: true },
      description: String,
      image: String,
      status: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
  ),
);
