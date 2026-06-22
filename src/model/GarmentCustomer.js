const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentCustomer",
  new mongoose.Schema(
    {
      customerCode: { type: String, unique: true },
      customerName: { type: String, required: true },
      phone: { type: String, required: true, unique: true },
      email: String,
      gender: String,
      dob: Date,
      gstNumber: String,
      loyaltyPoints: { type: Number, default: 0 },
      totalPurchaseAmount: { type: Number, default: 0 },
      dueAmount: { type: Number, default: 0 },
      status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true, versionKey: false },
  ),
);
