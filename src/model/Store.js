const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Store",
  new mongoose.Schema(
    {
      storeCode: { type: String, unique: true },
      storeName: { type: String, required: true },
      gstNumber: String,
      phone: String,
      email: String,
      address: Object,
      status: { type: String, default: "active" },
    },
    { timestamps: true, versionKey: false },
  ),
);
