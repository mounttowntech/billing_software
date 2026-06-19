const mongoose = require("mongoose");

const stockLedgerSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", default: null },

    movementType: {
      type: String,
      enum: [
        "purchase_in",
        "sale_out",
        "sale_return_in",
        "purchase_return_out",
        "adjustment_in",
        "adjustment_out",
        "recipe_consumption",
      ],
      required: true,
    },

    quantity: { type: Number, required: true },
    beforeStock: { type: Number, required: true },
    afterStock: { type: Number, required: true },

    referenceModel: String,
    referenceId: mongoose.Schema.Types.ObjectId,
    note: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockLedger", stockLedgerSchema);