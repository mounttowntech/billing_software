const express = require("express");
const router = express.Router();

const {
createSalesReturn,
getSalesReturns,
getSalesReturnById,
updateSalesReturnById,
deleteSalesReturn
} = require(
"../controllers/salesReturnController"
);

router.post("/create",createSalesReturn);

router.get("/all",getSalesReturns);

router.get("/:id",getSalesReturnById);

router.put(
  "/update/:id",
  updateSalesReturnById
);

router.delete("/delete/:id",deleteSalesReturn);

module.exports = router;