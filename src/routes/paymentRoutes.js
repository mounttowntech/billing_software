const router = require("express").Router();
const controller = require("../controllers/paymentController");

router.post("/create", controller.createPayment);
router.get("/all", controller.getPayments);

module.exports = router;