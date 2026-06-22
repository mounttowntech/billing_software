const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentAlteration",
  new mongoose.Schema(
    {
      alterationNo: { type: String, unique: true },
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GarmentCustomer",
      },
      invoice: { type: mongoose.Schema.Types.ObjectId, ref: "GarmentInvoice" },
      productName: String,
      alterationType: String,
      alterationCharge: { type: Number, default: 0 },
      expectedDeliveryDate: Date,
      status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "delivered"],
        default: "pending",
      },
    },
    { timestamps: true, versionKey: false },
  ),
);
