const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentStyle",
  new mongoose.Schema(
    {
      styleCode: String,
      styleName: { type: String, required: true },
      gender: { type: String, enum: ["Men", "Women", "Kids", "Unisex"] },
      description: String,
      status: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
  ),
);
