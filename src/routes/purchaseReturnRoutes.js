const express = require("express");
const router = express.Router();

const {
createPurchaseReturn,
getPurchaseReturns,
getPurchaseReturnById,
deletePurchaseReturn
} = require(
"../controllers/purchaseReturnController"
);

router.post("/create",createPurchaseReturn);

router.get("/all",getPurchaseReturns);

router.get("/:id",getPurchaseReturnById);

router.delete("/delete/:id",deletePurchaseReturn);

module.exports = router;