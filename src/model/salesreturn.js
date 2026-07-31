// SalesReturn production schema
const mongoose = require("mongoose");

const salesReturnSchema = new mongoose.Schema(
  {
    // returnNo: {
    //   type: String,
    //   unique: true,
    // },

    // invoice: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "GarmentInvoice",
    // },

    // customer: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "GarmentCustomer",
    // },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarmentProduct",
    },
    skuCode: String,
    
    returnDate: {
      type: Date,
      default: Date.now,
    },

    quantity: Number,

    refundAmount: Number,

    reason: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("SalesReturn", salesReturnSchema);
