const mongoose = require("mongoose");

const taxSettingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    percentage: { type: Number, required: true },
    type: { type: String, enum: ["gst", "cgst_sgst", "igst"], default: "gst" },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxSetting", taxSettingSchema);
