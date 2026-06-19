const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");

router.get("/sales", reportController.getSalesReport);
router.get("/purchases", reportController.getPurchaseReport);
router.get("/expenses", reportController.getExpenseReport);
router.get("/gst", reportController.getGSTReport);
router.get("/profit", reportController.getProfitReport);
router.get("/top-selling", reportController.getTopSellingProducts);
router.get("/low-stock", reportController.getLowStockReport);
router.get("/customer-due", reportController.getCustomerDueReport);
router.get("/supplier-due", reportController.getSupplierDueReport);
router.get("/stock-movement", reportController.getStockMovementReport);

module.exports = router;