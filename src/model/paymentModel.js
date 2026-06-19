const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true, sparse: true },

    type: {
      type: String,
      enum: ["sale", "purchase", "refund", "expense"],
      required: true,
    },

    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", default: null },
    salesReturn: { type: mongoose.Schema.Types.ObjectId, ref: "SalesReturn", default: null },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ["cash", "upi", "credit_card", "debit_card", "net_banking", "wallet"],
      required: true,
    },

    paymentDate: { type: Date, default: Date.now },
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);