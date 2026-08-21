// StockLedger production schema
// const mongoose = require("mongoose");

// const stockLedgerSchema = new mongoose.Schema(
//   {
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "GarmentProduct",
//     },

//     skuCode: String,

//     movementType: {
//       type: String,
//       enum: [
//         "purchase",
//         "sale",
//         "sales_return",
//         "sale_cancel",
//         "purchase_return",
//         "adjustment_in",
//         "adjustment_out",
//       ],
//     },

//     quantity: Number,

//     beforeStock: Number,

//     afterStock: Number,

//     referenceNumber: String,

//     remarks: String,
//   },
//   {
//     timestamps: true,
//     versionKey: false,
//   },
// );

// module.exports = mongoose.model("StockLedger", stockLedgerSchema);

const mongoose = require("mongoose");

const stockLedgerSchema = new mongoose.Schema(
  {
    // ============================================================
    // PRODUCT
    // ============================================================

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GarmentProduct",
      required: true,
      index: true,
    },

    // ============================================================
    // PRODUCT VARIANT
    // Important for garments:
    // T-Shirt / Size M / Black
    // T-Shirt / Size L / Black
    // ============================================================

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
      index: true,
    },

    // ============================================================
    // SKU / BARCODE
    // ============================================================

    skuCode: {
      type: String,
      trim: true,
      index: true,
    },

    barcode: {
      type: String,
      trim: true,
      index: true,
    },

    // ============================================================
    // INDUSTRY
    // ============================================================

    industryType: {
      type: String,
      enum: [
        "garments",
        "restaurant",
        "department_store",
        "general",
      ],
      required: true,
      index: true,
    },

    // ============================================================
    // MOVEMENT TYPE
    // ============================================================

    movementType: {
      type: String,
      enum: [
        "opening_stock",

        "purchase",
        "purchase_return",

        "sale",
        "sales_return",

        "sale_cancel",
        "purchase_cancel",

        "adjustment_in",
        "adjustment_out",

        "stock_transfer_in",
        "stock_transfer_out",

        "damage",
        "expired",
      ],
      required: true,
      index: true,
    },

    // ============================================================
    // QUANTITY
    // ============================================================

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // ============================================================
    // STOCK BEFORE / AFTER
    // ============================================================

    beforeStock: {
      type: Number,
      required: true,
      min: 0,
    },

    afterStock: {
      type: Number,
      required: true,
      min: 0,
    },

    // ============================================================
    // REFERENCE
    // Example:
    // PUR-2026-00001
    // INV-2026-00001
    // RET-2026-00001
    // ============================================================

    referenceType: {
      type: String,
      enum: [
        "purchase",
        "purchase_return",
        "invoice",
        "sales_return",
        "adjustment",
        "transfer",
        "opening",
        "damage",
        "expiry",
      ],
      index: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceNumber: {
      type: String,
      trim: true,
      index: true,
    },

    // ============================================================
    // STORE
    // ============================================================

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },

    // ============================================================
    // USER
    // ============================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ============================================================
    // REMARKS
    // ============================================================

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

// ============================================================
// INDEXES
// ============================================================

stockLedgerSchema.index({
  product: 1,
  createdAt: -1,
});

stockLedgerSchema.index({
  variant: 1,
  createdAt: -1,
});

stockLedgerSchema.index({
  skuCode: 1,
  createdAt: -1,
});

stockLedgerSchema.index({
  movementType: 1,
  createdAt: -1,
});

stockLedgerSchema.index({
  referenceType: 1,
  referenceId: 1,
});

stockLedgerSchema.index({
  store: 1,
  product: 1,
});

// module.exports = mongoose.model("StockLedger", stockLedgerSchema);
module.exports =
  mongoose.models.StockLedger ||
  mongoose.model("StockLedger", stockLedgerSchema);
