const express = require("express");
const router = express.Router();

const variantController = require("../controllers/productVariantController");

// Create Variant
router.post("/", variantController.createVariant);

// Get All Variants
router.get("/", variantController.getVariants);

// Get Single Variant
router.get("/:id", variantController.getVariantById);

// Update Variant
router.put("/:id", variantController.updateVariant);

// Update Variant Stock
router.patch(
  "/:id/stock",
  variantController.updateVariantStock
);

// Delete Variant
router.delete("/:id", variantController.deleteVariant);

module.exports = router;