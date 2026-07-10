const express = require("express");
const router = express.Router();

const {
createStockLedger,
getStockLedgers,
getStockLedgerById,
updateStockLedgerById,
deleteStockLedger
} = require(
"../controllers/stockledgerController"
);
router.post(
  "/create",
createStockLedger
);

router.get("/all",getStockLedgers);
router.get("/:id",getStockLedgerById);
router.put(
  "/update/:id",
  updateStockLedgerById
);
router.delete("/delete/:id",deleteStockLedger);

module.exports = router;