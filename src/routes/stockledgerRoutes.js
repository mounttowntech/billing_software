const express = require("express");
const router = express.Router();

const {
getStockLedgers,
getStockLedgerById,
deleteStockLedger
} = require(
"../controllers/stockledgerController"
);

router.get("/all",getStockLedgers);
router.get("/:id",getStockLedgerById);
router.delete("/delete/:id",deleteStockLedger);

module.exports = router;