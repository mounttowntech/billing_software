const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    industryType: {
      type: String,
      enum: ["garments", "restaurant", "departmental_store"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    level: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
