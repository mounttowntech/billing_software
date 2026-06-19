const router = require("express").Router();
const c = require("../controllers/stockAdjustmentController");

router.post("/", c.createStockAdjustment);
router.get("/", c.getStockAdjustments);

module.exports = router;
