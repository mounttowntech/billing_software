const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// --- Admin / Manager reports (Image 5 & 6) ---
router.get(
  "/summary",
  verifyToken,
  allowRoles("admin", "manager", "cashier"),
  reportController.getReportsSummary,
);

router.get(
  "/analytics",
  //   verifyToken,
  //   allowRoles("admin", "manager"),
  reportController.getReportsAnalytics,
);

router.get(
  "/sales-trend",
  //   allowRoles("admin", "manager"),
  reportController.getSalesTrend,
);

router.get(
  "/sales-by-category",
  //   allowRoles("admin", "manager"),
  reportController.getSalesByCategory,
);

router.get(
  "/sales-summary",
  //   allowRoles("admin", "manager"),
  reportController.getSalesSummary,
);

router.get(
  "/top-products",
  //   allowRoles("admin", "manager"),
  reportController.getTopSellingProducts,
);

router.get(
  "/export",
  //   allowRoles("admin", "manager"),
  reportController.exportReport,
);
router.get(
  "/export-pdf",
  verifyToken,
  reportController.exportPDFReport
);
// --- Manager Dashboard "Recent Sales" widget ---
router.get(
  "/manager-dashboard",
  //   allowRoles("admin", "manager"),
  reportController.getManagerDashboard,
);

module.exports = router;
