const mongoose = require("mongoose");

const kitchenOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: String,
    quantity: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
    },
  },
  { _id: false }
);

const kitchenOrderSchema = new mongoose.Schema(
  {
    kotNumber: { type: String, required: true, unique: true },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
    },

    tableNo: String,

    items: [kitchenOrderItemSchema],

    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KitchenOrder", kitchenOrderSchema);