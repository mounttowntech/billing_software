const express = require("express");
const router = express.Router();

const {
createStockAdjustment,
getStockAdjustments,
getStockAdjustmentById,
updateStockAdjustmentById,
deleteStockAdjustment
} = require(
"../controllers/stockAdjustmentController"
);

router.post("/create",createStockAdjustment);
router.get("/all",getStockAdjustments);
router.get("/:id",getStockAdjustmentById);
router.put(
  "/update/:id",
 updateStockAdjustmentById
);
router.delete("/delete/:id",deleteStockAdjustment);

module.exports = router;