const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },
    industryType: {
      type: String,
      enum: ["garments", "restaurant", "departmental_store"],
      required: true,
    },
    phone: String,
    email: String,
    gstNumber: String,
    address: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
