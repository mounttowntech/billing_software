const mongoose = require("mongoose");

const recipeItemSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "pcs" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    industryType: {
      type: String,
      enum: ["garments", "restaurant", "departmental_store"],
      required: true,
    },

    type: {
      type: String,
      enum: ["stock_product", "menu_item", "raw_material", "service"],
      default: "stock_product",
    },

    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    barcode: String,

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    categoryName: String,

    courseType: {
      type: String,
      enum: ["main_course", "fast_food", "starter", "beverage", "dessert", "none"],
      default: "none",
    },

    hsnCode: String,
    gstPercentage: { type: Number, default: 0 },

    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },

    stockQuantity: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 5 },

    unit: { type: String, default: "pcs" },
    hasVariants: { type: Boolean, default: false },

    recipe: [recipeItemSchema],

    batchNo: String,
    expiryDate: Date,
    image: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);