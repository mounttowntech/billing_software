const express = require("express");

const router = express.Router();
const { uploadProduct } = require("../middleware/uploadmiddleware");
const {
  createProduct,

  getProducts,

  getProductById,

  updateProduct,

  deleteProduct,

  searchBySKU,

  searchByBarcode,

  stockSummary,
} = require("../controllers/productController");

router.post("/create", uploadProduct.single("image"), createProduct);

router.get("/all", getProducts);

router.get("/stock-summary", stockSummary);

router.get("/:id", getProductById);

router.put("/update/:id", uploadProduct.single("image"), updateProduct);

router.delete("/delete/:id", deleteProduct);

// SKU Search

router.get("/sku/:sku", searchBySKU);

//  Barcode Search

router.get("/barcode/:barcode", searchByBarcode);

module.exports = router;
