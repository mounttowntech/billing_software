const express = require("express");
const router = express.Router();

// TODO: replace with your actual auth/permission middleware path & names
const { verifyToken } = require("../middleware/authMiddleware");

const {
  getDashboardSummary,
  getSalesOverview,
  getSalesByCategory,
  getTopSellingProducts,
  getQuickStats,
  getRecentTransactions,
  getTopCustomers,
  getLowStockAlerts,
  getFullDashboard,
} = require("../controllers/dashboardController");

// All routes are protected — dashboard should only be visible to logged-in users


/* ==========================================
   Individual widget endpoints
   (use these if you want to load/refresh widgets independently,
   e.g. changing the date range filter on just the summary cards)
========================================== */

// GET /api/dashboard/summary?startDate=2024-05-01&endDate=2024-05-31
router.get("/summary", getDashboardSummary);

// GET /api/dashboard/sales-overview
router.get("/sales-overview", getSalesOverview);

// GET /api/dashboard/sales-by-category?startDate=&endDate=
router.get("/sales-by-category", getSalesByCategory);

// GET /api/dashboard/top-products?startDate=&endDate=&limit=5
router.get("/top-products", getTopSellingProducts);

// GET /api/dashboard/quick-stats
router.get("/quick-stats", getQuickStats);

// GET /api/dashboard/recent-transactions?limit=10
router.get("/recent-transactions", getRecentTransactions);

// GET /api/dashboard/top-customers?limit=5
router.get("/top-customers", getTopCustomers);

// GET /api/dashboard/low-stock-alerts?limit=10
router.get("/low-stock-alerts", getLowStockAlerts);

/* ==========================================
   Combined endpoint
   (recommended for the initial dashboard page load —
   fires all widgets in one round trip)
========================================== */

// GET /api/dashboard/full?startDate=&endDate=
router.get("/all", getFullDashboard);

module.exports = router;