const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    skuCode: { type: String, unique: true },
    barcode: { type: String, unique: true },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    },
    color: { type: String, required: true },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number, required: true },
    gstPercentage: { type: Number, default: 5 },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const garmentProductSchema = new mongoose.Schema(
  {
    productCode: { type: String, unique: true },
    productName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "GarmentCategory" },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "GarmentBrand" },
    fabric: { type: mongoose.Schema.Types.ObjectId, ref: "GarmentFabric" },
    season: { type: mongoose.Schema.Types.ObjectId, ref: "GarmentSeason" },
    style: { type: mongoose.Schema.Types.ObjectId, ref: "GarmentStyle" },
    gender: { type: String, enum: ["Men", "Women", "Kids", "Unisex"] },
    description: String,
    image: {
      type: String,
      default: "",
    },
    variants: [variantSchema],
    totalStock: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

garmentProductSchema.pre("save", function () {
  this.totalStock = this.variants.reduce(
    (total, variant) => total + (variant.currentStock || 0),
    0,
  );
});

module.exports = mongoose.model("GarmentProduct", garmentProductSchema);
