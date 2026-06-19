const router = require("express").Router();
const controller = require("../controllers/purchaseController");

router.post("/", controller.createPurchase);
router.get("/", controller.getPurchases);

module.exports = router;