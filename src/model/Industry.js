const mongoose = require("mongoose");

const industrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["garments", "restaurant", "departmental_store"],
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true },
    description: String,
    modules: {
      variants: { type: Boolean, default: false },
      recipe: { type: Boolean, default: false },
      tableOrder: { type: Boolean, default: false },
      batchExpiry: { type: Boolean, default: false },
      barcode: { type: Boolean, default: true },
      returnRefund: { type: Boolean, default: true },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Industry", industrySchema);
