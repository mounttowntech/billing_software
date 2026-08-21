const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarmentProduct",
      required: true,
    },

    skuCode: {
      type: String,
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
    },

    productName: {
      type: String,
      trim: true,
    },

    size: {
      type: String,
      trim: true,
    },

    color: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      default: 5,
      min: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const garmentInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarmentCustomer",
      default: null,
    },

    // Employee/User who created the invoice
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Change to "User" if your authentication uses User model
      required: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],

    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: [(arr) => arr.length > 0, "Invoice must contain at least one item"],
    },

    subTotal: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
    },

    returnAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "upi",
        "card",
        "wallet",
        "credit",
        "cashfree",
        "net_banking",
        "cheque",
      ],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: [
        "paid",
        "partial",
        "pending",
      ],
      default: "pending",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "GarmentInvoice",
  garmentInvoiceSchema
);