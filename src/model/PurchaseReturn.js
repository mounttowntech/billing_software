const mongoose = require("mongoose");

const purchaseReturnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", default: null },
    productName: String,
    quantity: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    items: [purchaseReturnItemSchema],
    totalRefundAmount: { type: Number, default: 0 },
    reason: String,
    status: { type: String, enum: ["returned", "pending"], default: "returned" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseReturn", purchaseReturnSchema);
