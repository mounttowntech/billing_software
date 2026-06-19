const router = require("express").Router();
const controller = require("../controllers/invoiceController");

router.post("/create", controller.createInvoice);
router.get("/all", controller.getInvoices);

module.exports = router;