const express = require("express");

const router = express.Router();

const reportController = require("../controllers/reportController");

// ============================================================
// REPORT SUMMARY
// ============================================================

router.get(
  "/summary",
  reportController.getReportsSummary
);

// ============================================================
// REPORT ANALYTICS
// ============================================================

router.get(
  "/analytics",
  reportController.getReportsAnalytics
);

// ============================================================
// SALES TREND
// ============================================================

router.get(
  "/sales-trend",
  reportController.getSalesTrend
);

// ============================================================
// SALES BY CATEGORY / PRODUCT
// ============================================================

router.get(
  "/sales-by-category",
  reportController.getSalesByCategory
);

// ============================================================
// SALES SUMMARY / LEDGER
// ============================================================

router.get(
  "/sales-summary",
  reportController.getSalesSummary
);

// ============================================================
// TOP SELLING PRODUCTS
// ============================================================

router.get(
  "/top-selling-products",
  reportController.getTopSellingProducts
);

// ============================================================
// EXPORT PDF
// ============================================================

router.get(
  "/export-pdf",
  reportController.exportPDFReport
);

// ============================================================
// EXPORT EXCEL
// ============================================================

router.get(
  "/export-excel",
  reportController.exportReport
);

module.exports = router;