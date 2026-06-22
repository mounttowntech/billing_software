const mongoose = require("mongoose");
module.exports = mongoose.model(
  "TaxSetting",
  new mongoose.Schema(
    {
      taxName: String,
      taxCode: String,
      taxPercentage: Number,
      taxType: { type: String, enum: ["GST", "CGST", "SGST", "IGST"] },
      isDefault: Boolean,
    },
    { timestamps: true, versionKey: false },
  ),
);
