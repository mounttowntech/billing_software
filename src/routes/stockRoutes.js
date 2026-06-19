const router = require("express").Router();
const controller = require("../controllers/stockController");

router.post("/adjust", controller.adjustStock);
router.get("/ledger", controller.getStockLedger);
router.get("/low-stock", controller.getLowStockProducts);

module.exports = router;