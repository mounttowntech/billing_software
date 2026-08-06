const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // =====================================
    // Payment Number
    // =====================================

    paymentNo: {
      type: String,
      unique: true,
      required: true,
    },

    // =====================================
    // Payment Type
    // =====================================

    type: {
      type: String,
      enum: ["sale", "purchase", "refund"],
      required: true,
    },

    // =====================================
    // Customer / Supplier
    // =====================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarmentCustomer",
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    // =====================================
    // Invoice / Purchase
    // =====================================

    invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GarmentInvoice"
},

    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },

    // =====================================
    // Amount
    // =====================================

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // =====================================
    // Payment Method
    // =====================================

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "upi",
        "card",
        "wallet",
        "net_banking",
        "cheque",
        "cashfree",
      ],
      default: "cashfree",
    },

    // =====================================
    // Payment Status
    // =====================================

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      default: "",
    },

    // =====================================
    // Cashfree Order Details
    // =====================================

    cashfreeOrderId: {
      type: String,
      index: true,
    },

    cashfreePaymentId: {
      type: String,
    },

    paymentSessionId: {
      type: String,
    },

    orderToken: {
      type: String,
    },

    orderStatus: {
      type: String,
      default: "ACTIVE",
    },

    // =====================================
    // Cashfree Customer Details
    // =====================================

    customerName: String,

    customerEmail: String,

    customerPhone: String,

    // =====================================
    // Gateway Response
    // =====================================

    gatewayResponse: {
      type: Object,
      default: {},
    },

    // =====================================
    // Webhook
    // =====================================

    webhookResponse: {
      type: Object,
      default: {},
    },

    // =====================================
    // Refund
    // =====================================

    refundId: String,

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundStatus: {
      type: String,
      enum: [
        "none",
        "pending",
        "processed",
        "failed",
      ],
      default: "none",
    },

    // =====================================
    // Audit
    // =====================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =====================================
Indexes
===================================== */

paymentSchema.index({ paymentNo: 1 });

paymentSchema.index({ paymentStatus: 1 });

paymentSchema.index({ paymentMethod: 1 });

paymentSchema.index({ cashfreeOrderId: 1 });

paymentSchema.index({ customer: 1 });

paymentSchema.index({ supplier: 1 });

paymentSchema.index({ invoice: 1 });

paymentSchema.index({ purchase: 1 });

module.exports = mongoose.model("Payment", paymentSchema);