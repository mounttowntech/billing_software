const express = require("express");
const router = express.Router();

const {
createPurchase,
getPurchases,
getPurchaseById,
deletePurchase
} = require(
"../controllers/purchaseController"
);

router.post("/create",createPurchase);

router.get("/all",getPurchases);

router.get("/:id",getPurchaseById);

router.delete("/delete/:id",deletePurchase);

module.exports = router;