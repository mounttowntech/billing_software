const express = require("express");
const router = express.Router();

const purchaseController = require("../controllers/purchaseController");

// Create Purchase
router.post("/", purchaseController.createPurchase);

// Get All Purchases
router.get("/", purchaseController.getPurchases);

// // Get Single Purchase
// router.get("/:id", purchaseController.getPurchaseById);

// // Update Purchase
// router.put("/:id", purchaseController.updatePurchase);

// // Delete Purchase
// router.delete("/:id", purchaseController.deletePurchase);

module.exports = router;