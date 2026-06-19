const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sku: { type: String, required: true, unique: true },
    barcode: String,

    size: String,
    color: String,
    fit: String,

    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },

    stockQuantity: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 5 },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductVariant", productVariantSchema);