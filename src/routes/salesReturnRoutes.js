const express = require("express");
const router = express.Router();

const {
createSalesReturn,
getSalesReturns,
getSalesReturnById,
deleteSalesReturn
} = require(
"../controllers/salesReturnController"
);

router.post("/create",createSalesReturn);

router.get("/all",getSalesReturns);

router.get("/:id",getSalesReturnById);

router.delete("/delete/:id",deleteSalesReturn);

module.exports = router;