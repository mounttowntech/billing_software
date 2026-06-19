const mongoose = require("mongoose");

const customerAddressSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    label: { type: String, enum: ["home", "office", "billing", "shipping"], default: "home" },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerAddress", customerAddressSchema);
