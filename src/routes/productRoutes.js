const express = require("express");

const router = express.Router();

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



router.post("/", createProduct);

router.get("/", getProducts);

router.get("/stock-summary", stockSummary);

router.get("/:id", getProductById);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

// SKU Search


router.get("/sku/:sku", searchBySKU);

//  Barcode Search


router.get("/barcode/:barcode", searchByBarcode);

module.exports = router;
