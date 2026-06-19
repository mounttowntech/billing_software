const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", default: null },

    productName: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    gstPercentage: { type: Number, default: 0 },

    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    returnedQuantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },

    industryType: {
      type: String,
      enum: ["garments", "restaurant", "departmental_store"],
      required: true,
    },

    orderType: {
      type: String,
      enum: ["retail", "dine_in", "takeaway", "delivery"],
      default: "retail",
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
    },

    tableNo: String,

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customerName: String,
    customerPhone: String,

    items: [invoiceItemSchema],

    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },

    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },

    grandTotal: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "credit_card", "debit_card", "net_banking", "wallet"],
      default: "cash",
    },

    orderStatus: {
      type: String,
      enum: ["created", "kitchen", "served", "completed", "cancelled"],
      default: "completed",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);