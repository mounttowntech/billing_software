const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", default: null },
    productName: String,
    quantity: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
  },
  { _id: false }
);

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    items: [returnItemSchema],

    totalRefundAmount: { type: Number, default: 0 },

    refundMethod: {
      type: String,
      enum: ["cash", "upi", "wallet", "bank", "store_credit"],
      default: "cash",
    },

    reason: String,

    status: {
      type: String,
      enum: ["refunded", "pending"],
      default: "refunded",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesReturn", salesReturnSchema);