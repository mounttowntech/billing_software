const mongoose = require("mongoose");

const GarmentInvoice = require("../model/GarmentInvoice");
const Purchase = require("../model/Purchase");
const Expense = require("../model/Expense");
const Payment = require("../model/Payment");
const GarmentProduct = require("../model/GarmentProduct");
const GarmentCustomer = require("../model/GarmentCustomer");
const Supplier = require("../model/supplierModel");
const GarmentCategory = require("../model/GarmentCategory");

// ASSUMPTION: these models may not exist yet in your project.
// They're required defensively so the file still loads even if they're missing.
// Wire up the real models (or delete the fallback branches) once they exist.
let Staff;
try {
  Staff = require("../model/Staff");
} catch (e) {
  Staff = null;
}

let StockLog;
try {
  StockLog = require("../model/StockLog");
} catch (e) {
  StockLog = null;
}

/* ==========================================
   Helpers
========================================== */

// Resolves { startDate, endDate } from query, defaults to current month
function resolveDateRange(query) {
  const now = new Date();

  let startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  let endDate = query.endDate ? new Date(query.endDate) : now;

  // include full end day
  endDate = new Date(endDate);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

// Previous period of equal length, immediately before startDate
function getPreviousPeriod(startDate, endDate) {
  const duration = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - duration);
  return { prevStartDate, prevEndDate };
}

function percentChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

// Today's 00:00:00.000 -> 23:59:59.999
function getTodayRange() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

// Yesterday's 00:00:00.000 -> 23:59:59.999
function getYesterdayRange() {
  const { start: todayStart } = getTodayRange();
  const start = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const end = new Date(todayStart.getTime() - 1);
  return { start, end };
}

async function sumField(
  Model,
  dateField,
  startDate,
  endDate,
  sumExpr,
  extraMatch = {},
) {
  const result = await Model.aggregate([
    {
      $match: {
        [dateField]: { $gte: startDate, $lte: endDate },
        ...extraMatch,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: sumExpr },
      },
    },
  ]);

  return result.length ? result[0].total : 0;
}

// Total value of stock currently on hand (currentStock * costPrice, falling
// back to `price` if `costPrice` doesn't exist on your variant schema).
async function getInventoryValue() {
  const result = await GarmentProduct.aggregate([
    { $unwind: "$variants" },
    {
      $group: {
        _id: null,
        value: {
          $sum: {
            $multiply: [
              "$variants.currentStock",
              {
                $ifNull: [
                  "$variants.costPrice",
                  { $ifNull: ["$variants.price", 0] },
                ],
              },
            ],
          },
        },
      },
    },
  ]);
  return result.length ? result[0].value : 0;
}

async function getLowStockCount() {
  const result = await GarmentProduct.aggregate([
    { $unwind: "$variants" },
    {
      $match: {
        $expr: { $lte: ["$variants.currentStock", "$variants.minimumStock"] },
      },
    },
    { $count: "count" },
  ]);
  return result.length ? result[0].count : 0;
}

// Shared by getLowStockAlerts, getManagerDashboard, getInventoryDashboard
async function buildLowStockList(limit) {
  return GarmentProduct.aggregate([
    { $unwind: "$variants" },
    {
      $match: {
        $expr: { $lte: ["$variants.currentStock", "$variants.minimumStock"] },
      },
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: 1,
        size: "$variants.size",
        color: "$variants.color",
        skuCode: "$variants.skuCode",
        currentStock: "$variants.currentStock",
        minimumStock: "$variants.minimumStock",
        status: {
          $cond: [
            { $eq: ["$variants.currentStock", 0] },
            "Out of Stock",
            "Low Stock",
          ],
        },
      },
    },
    { $sort: { currentStock: 1 } },
    { $limit: limit },
  ]);
}

// ASSUMPTION: ?period=week (default) shows the last 7 days, ?period=month
// shows the current calendar month, both grouped by day.
async function buildSalesOverviewSeries(period) {
  const now = new Date();
  let start;

  if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
  }

  const data = await GarmentInvoice.aggregate([
    { $match: { invoiceDate: { $gte: start, $lte: now } } },
    {
      $group: {
        _id: {
          year: { $year: "$invoiceDate" },
          month: { $month: "$invoiceDate" },
          day: { $dayOfMonth: "$invoiceDate" },
        },
        total: { $sum: "$grandTotal" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return data.map((d) => ({
    date: new Date(d._id.year, d._id.month - 1, d._id.day),
    total: d.total,
  }));
}

// ASSUMPTION: Purchase docs have a paymentStatus field like GarmentInvoice
// does elsewhere in this file ("paid" / "partial" / "pending"). Adjust the
// value compared against if your schema differs.
async function getPendingPurchaseCount() {
  return Purchase.countDocuments({ paymentStatus: { $ne: "paid" } });
}

// ASSUMPTION: no attendance/Staff model exists yet, so this returns 0 until
// one is wired up. Expected shape: Staff.attendanceDate (Date),
// Staff.status ("present" | "absent").
async function getStaffPresentCount() {
  if (!Staff) return 0;
  try {
    const { start, end } = getTodayRange();
    return await Staff.countDocuments({
      attendanceDate: { $gte: start, $lte: end },
      status: "present",
    });
  } catch (e) {
    return 0;
  }
}

// Falls back to deriving stock movements from Purchase (stock in) and
// GarmentInvoice (stock out) line items if no dedicated StockLog model
// exists yet. Swap in the real model once you add one.
async function buildStockActivitiesFallback(limit) {
  const [purchases, sales] = await Promise.all([
    Purchase.find()
      .sort({ purchaseDate: -1 })
      .limit(limit)
      .select("purchaseNo purchaseDate items"),
    GarmentInvoice.find()
      .sort({ invoiceDate: -1 })
      .limit(limit)
      .select("invoiceNo invoiceDate items"),
  ]);

  const activities = [];

  purchases.forEach((p) => {
    (p.items || []).forEach((it) => {
      activities.push({
        reference: p.purchaseNo,
        type: "Stock In",
        item: it.productName || "-",
        quantity: it.quantity || 0,
        date: p.purchaseDate,
      });
    });
  });

  sales.forEach((s) => {
    (s.items || []).forEach((it) => {
      activities.push({
        reference: s.invoiceNo,
        type: "Stock Out",
        item: it.productName || "-",
        quantity: it.quantity || 0,
        date: s.invoiceDate,
      });
    });
  });

  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  return activities.slice(0, limit);
}

async function getRecentStockActivities(limit) {
  if (StockLog) {
    try {
      return await StockLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("referenceNo type itemName quantity createdAt");
    } catch (e) {
      return buildStockActivitiesFallback(limit);
    }
  }
  return buildStockActivitiesFallback(limit);
}

/* ==========================================
   1. Dashboard Summary Cards
   (Total Sales, Total Purchases, Gross Profit, Net Profit)
========================================== */

exports.getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query);
    const { prevStartDate, prevEndDate } = getPreviousPeriod(
      startDate,
      endDate,
    );

    const [totalSales, totalPurchases, totalExpenses] = await Promise.all([
      sumField(
        GarmentInvoice,
        "invoiceDate",
        startDate,
        endDate,
        "$grandTotal",
      ),
      sumField(Purchase, "purchaseDate", startDate, endDate, "$grandTotal"),
      sumField(Expense, "expenseDate", startDate, endDate, "$amount"),
    ]);

    const [prevSales, prevPurchases, prevExpenses] = await Promise.all([
      sumField(
        GarmentInvoice,
        "invoiceDate",
        prevStartDate,
        prevEndDate,
        "$grandTotal",
      ),
      sumField(
        Purchase,
        "purchaseDate",
        prevStartDate,
        prevEndDate,
        "$grandTotal",
      ),
      sumField(Expense, "expenseDate", prevStartDate, prevEndDate, "$amount"),
    ]);

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    const prevGrossProfit = prevSales - prevPurchases;
    const prevNetProfit = prevGrossProfit - prevExpenses;

    return res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: {
        range: { startDate, endDate },
        totalSales: {
          amount: totalSales,
          changePercent: percentChange(totalSales, prevSales),
        },
        totalPurchases: {
          amount: totalPurchases,
          changePercent: percentChange(totalPurchases, prevPurchases),
        },
        grossProfit: {
          amount: grossProfit,
          changePercent: percentChange(grossProfit, prevGrossProfit),
        },
        netProfit: {
          amount: netProfit,
          changePercent: percentChange(netProfit, prevNetProfit),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

/* ==========================================
   2. Sales Overview Chart (This Month vs Last Month, by day)
========================================== */

exports.getSalesOverview = async (req, res) => {
  try {
    const now = new Date();

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = now;

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const buildDailySeries = async (start, end) => {
      const data = await GarmentInvoice.aggregate([
        { $match: { invoiceDate: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dayOfMonth: "$invoiceDate" },
            total: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return data.map((d) => ({ day: d._id, total: d.total }));
    };

    const [thisMonth, lastMonth] = await Promise.all([
      buildDailySeries(thisMonthStart, thisMonthEnd),
      buildDailySeries(lastMonthStart, lastMonthEnd),
    ]);

    return res.status(200).json({
      success: true,
      message: "Sales overview fetched successfully",
      data: { thisMonth, lastMonth },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales overview",
      error: error.message,
    });
  }
};

/* ==========================================
   3. Sales by Category (Donut Chart)
========================================== */

exports.getSalesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query);

    const data = await GarmentInvoice.aggregate([
      { $match: { invoiceDate: { $gte: startDate, $lte: endDate } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "garmentproducts",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "garmentcategories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$categoryInfo.categoryName", "Uncategorized"] },
          total: { $sum: "$items.totalAmount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = data.reduce((sum, d) => sum + d.total, 0);

    const result = data.map((d) => ({
      category: d._id,
      total: d.total,
      percentage:
        grandTotal > 0 ? Number(((d.total / grandTotal) * 100).toFixed(2)) : 0,
    }));

    return res.status(200).json({
      success: true,
      message: "Sales by category fetched successfully",
      data: { total: grandTotal, breakdown: result },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales by category",
      error: error.message,
    });
  }
};

/* ==========================================
   4. Top Selling Products
========================================== */

exports.getTopSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query);
    const limit = Number(req.query.limit) || 5;

    const data = await GarmentInvoice.aggregate([
      { $match: { invoiceDate: { $gte: startDate, $lte: endDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          quantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      message: "Top selling products fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top selling products",
      error: error.message,
    });
  }
};

/* ==========================================
   5. Quick Stats (Customers, Suppliers, Low Stock, Due Amount)
========================================== */

exports.getQuickStats = async (req, res) => {
  try {
    const [totalCustomers, totalSuppliers, lowStockResult, dueResult] =
      await Promise.all([
        GarmentCustomer.countDocuments({ status: "active" }),
        Supplier.countDocuments({ status: true }),

        GarmentProduct.aggregate([
          { $unwind: "$variants" },
          {
            $match: {
              $expr: {
                $lte: ["$variants.currentStock", "$variants.minimumStock"],
              },
            },
          },
          { $count: "count" },
        ]),

        GarmentInvoice.aggregate([
          { $match: { dueAmount: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$dueAmount" } } },
        ]),
      ]);

    return res.status(200).json({
      success: true,
      message: "Quick stats fetched successfully",
      data: {
        totalCustomers,
        totalSuppliers,
        lowStockItems: lowStockResult.length ? lowStockResult[0].count : 0,
        dueAmount: dueResult.length ? dueResult[0].total : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quick stats",
      error: error.message,
    });
  }
};

/* ==========================================
   6. Recent Transactions (Sales, Purchase, Payment, Expense)
========================================== */

exports.getRecentTransactions = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const [sales, purchases, payments, expenses] = await Promise.all([
      GarmentInvoice.find()
        .populate("customer", "customerName")
        .sort({ invoiceDate: -1 })
        .limit(limit)
        .select("invoiceNo invoiceDate grandTotal paymentStatus customer"),

      Purchase.find()
        .populate("supplier", "supplierName")
        .sort({ purchaseDate: -1 })
        .limit(limit)
        .select("purchaseNo purchaseDate grandTotal paymentStatus supplier"),

      Payment.find()
        .populate("customer", "customerName")
        .sort({ paymentDate: -1 })
        .limit(limit)
        .select("paymentNo paymentDate amount type customer"),

      Expense.find()
        .sort({ expenseDate: -1 })
        .limit(limit)
        .select("expenseNo expenseDate amount title category"),
    ]);

    const combined = [
      ...sales.map((s) => ({
        type: "Sale",
        referenceNo: s.invoiceNo,
        date: s.invoiceDate,
        party: s.customer ? s.customer.customerName : "Walk-in Customer",
        amount: s.grandTotal,
        status: s.paymentStatus,
      })),
      ...purchases.map((p) => ({
        type: "Purchase",
        referenceNo: p.purchaseNo,
        date: p.purchaseDate,
        party: p.supplier ? p.supplier.supplierName : "-",
        amount: p.grandTotal,
        status: p.paymentStatus,
      })),
      ...payments.map((p) => ({
        type: "Payment",
        referenceNo: p.paymentNo,
        date: p.paymentDate,
        party: p.customer ? p.customer.customerName : "-",
        amount: p.amount,
        status: "Received",
      })),
      ...expenses.map((e) => ({
        type: "Expense",
        referenceNo: e.expenseNo,
        date: e.expenseDate,
        party: e.title,
        amount: e.amount,
        status: "Paid",
      })),
    ];

    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      message: "Recent transactions fetched successfully",
      data: combined.slice(0, limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent transactions",
      error: error.message,
    });
  }
};

/* ==========================================
   7. Top Customers
========================================== */

exports.getTopCustomers = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const data = await GarmentInvoice.aggregate([
      { $match: { customer: { $ne: null } } },
      {
        $group: {
          _id: "$customer",
          totalPurchase: { $sum: "$grandTotal" },
          dueAmount: { $sum: "$dueAmount" },
        },
      },
      { $sort: { totalPurchase: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "garmentcustomers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
      {
        $project: {
          _id: 0,
          customerId: "$customerInfo._id",
          customerName: "$customerInfo.customerName",
          totalPurchase: 1,
          dueAmount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Top customers fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top customers",
      error: error.message,
    });
  }
};

/* ==========================================
   8. Low Stock Alerts
========================================== */

exports.getLowStockAlerts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await buildLowStockList(limit);

    return res.status(200).json({
      success: true,
      message: "Low stock alerts fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch low stock alerts",
      error: error.message,
    });
  }
};

/* ==========================================
   9. Combined Dashboard (single call for initial page load)
========================================== */

exports.getFullDashboard = async (req, res) => {
  try {
    const fakeRes = () => ({
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    });

    const summaryRes = fakeRes();
    const overviewRes = fakeRes();
    const categoryRes = fakeRes();
    const topProductsRes = fakeRes();
    const statsRes = fakeRes();
    const transactionsRes = fakeRes();
    const topCustomersRes = fakeRes();
    const lowStockRes = fakeRes();

    await Promise.all([
      exports.getDashboardSummary(req, summaryRes),
      exports.getSalesOverview(req, overviewRes),
      exports.getSalesByCategory(req, categoryRes),
      exports.getTopSellingProducts(req, topProductsRes),
      exports.getQuickStats(req, statsRes),
      exports.getRecentTransactions(req, transactionsRes),
      exports.getTopCustomers(req, topCustomersRes),
      exports.getLowStockAlerts(req, lowStockRes),
    ]);

    return res.status(200).json({
      success: true,
      message: "Full dashboard fetched successfully",
      data: {
        summary: summaryRes.payload.data,
        salesOverview: overviewRes.payload.data,
        salesByCategory: categoryRes.payload.data,
        topSellingProducts: topProductsRes.payload.data,
        quickStats: statsRes.payload.data,
        recentTransactions: transactionsRes.payload.data,
        topCustomers: topCustomersRes.payload.data,
        lowStockAlerts: lowStockRes.payload.data,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch full dashboard",
      error: error.message,
    });
  }
};

/* ==========================================
   10. Admin Dashboard
   (date-range filtered: Total Sales, Total Purchases, Low Stock,
    Net Profit + Recent Sales table)
========================================== */

exports.getAdminDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query);
    const { prevStartDate, prevEndDate } = getPreviousPeriod(
      startDate,
      endDate,
    );

    const [totalSales, totalPurchases, totalExpenses, lowStockCount] =
      await Promise.all([
        sumField(
          GarmentInvoice,
          "invoiceDate",
          startDate,
          endDate,
          "$grandTotal",
        ),
        sumField(Purchase, "purchaseDate", startDate, endDate, "$grandTotal"),
        sumField(Expense, "expenseDate", startDate, endDate, "$amount"),
        getLowStockCount(),
      ]);

    const [prevSales, prevPurchases, prevExpenses] = await Promise.all([
      sumField(
        GarmentInvoice,
        "invoiceDate",
        prevStartDate,
        prevEndDate,
        "$grandTotal",
      ),
      sumField(
        Purchase,
        "purchaseDate",
        prevStartDate,
        prevEndDate,
        "$grandTotal",
      ),
      sumField(Expense, "expenseDate", prevStartDate, prevEndDate, "$amount"),
    ]);

    const netProfit = totalSales - totalPurchases - totalExpenses;
    const prevNetProfit = prevSales - prevPurchases - prevExpenses;

    const recentSales = await GarmentInvoice.find()
      .populate("customer", "customerName")
      .sort({ invoiceDate: -1 })
      .limit(10)
      .select("invoiceNo invoiceDate grandTotal paymentStatus customer");

    const recentSalesFormatted = recentSales.map((s) => ({
      invoiceId: s._id,
      invoiceNo: s.invoiceNo,
      customer: s.customer ? s.customer.customerName : "Walk-in Customer",
      date: s.invoiceDate,
      total: s.grandTotal,
      status: s.paymentStatus,
    }));

    return res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: {
        range: { startDate, endDate },
        totalSales: {
          amount: totalSales,
          changePercent: percentChange(totalSales, prevSales),
        },
        totalPurchases: {
          amount: totalPurchases,
          changePercent: percentChange(totalPurchases, prevPurchases),
        },
        lowStock: {
          count: lowStockCount,
          needReorder: lowStockCount,
        },
        netProfit: {
          amount: netProfit,
          changePercent: percentChange(netProfit, prevNetProfit),
        },
        recentSales: recentSalesFormatted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
      error: error.message,
    });
  }
};

/* ==========================================
   11. Manager Dashboard
   (Today's Sales/Orders/Profit, Total Sales, Sales Overview chart,
    Quick Summary, Recent Sales, Low Stock Items)
========================================== */

exports.getManagerDashboard = async (req, res) => {
  try {
    const { start: todayStart, end: todayEnd } = getTodayRange();

    // Today's statistics
    const [
      todaySales,
      todayOrders,
      todayPurchases,
      todayExpenses,
    ] = await Promise.all([
      sumField(
        GarmentInvoice,
        "invoiceDate",
        todayStart,
        todayEnd,
        "$grandTotal"
      ),

      GarmentInvoice.countDocuments({
        invoiceDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),

      sumField(
        Purchase,
        "purchaseDate",
        todayStart,
        todayEnd,
        "$grandTotal"
      ),

      sumField(
        Expense,
        "expenseDate",
        todayStart,
        todayEnd,
        "$amount"
      ),
    ]);

    const todayProfit =
      todaySales - todayPurchases - todayExpenses;

    // Monthly Sales
    const now = new Date();

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const totalSales = await sumField(
      GarmentInvoice,
      "invoiceDate",
      monthStart,
      now,
      "$grandTotal"
    );

    // Sales Overview
    const period =
      req.query.period === "month"
        ? "month"
        : "week";

    const salesOverview =
      await buildSalesOverviewSeries(period);

    // Quick Summary
    const [
      inventoryValue,
      lowStockCount,
      pendingPurchase,
      totalCustomers,
      staffPresent,
    ] = await Promise.all([
      getInventoryValue(),
      getLowStockCount(),
      getPendingPurchaseCount(),
      GarmentCustomer.countDocuments({
        status: "active",
      }),
      getStaffPresentCount(),
    ]);

    // Recent Sales
    const recentSales = await GarmentInvoice.find()
      .populate("customer", "customerName")
      .sort({ invoiceDate: -1 })
      .limit(10)
      .select(
        "invoiceNo invoiceDate grandTotal paymentStatus paymentMethod customer"
      );

    const recentSalesFormatted = recentSales.map((sale) => ({
      invoiceNo: sale.invoiceNo,
      customer:
        sale.customer?.customerName ||
        "Walk-in Customer",
      time: sale.invoiceDate,
      amount: sale.grandTotal,
      paymentType: sale.paymentMethod || "-",
      cashier: "-", // createdBy field doesn't exist
      status: sale.paymentStatus,
    }));

    // Low Stock List
    const lowStockItemsList =
      await buildLowStockList(10);

    return res.status(200).json({
      success: true,
      message:
        "Manager dashboard fetched successfully",

      data: {
        today: {
          sales: todaySales,
          orders: todayOrders,
          profit: todayProfit,
        },

        totalSales,

        salesOverview: {
          period,
          series: salesOverview,
        },

        quickSummary: {
          inventoryValue,
          lowStockItems: lowStockCount,
          pendingPurchase,
          todaysExpenses: todayExpenses,
          customers: totalCustomers,
          staffPresent,
        },

        recentSales: recentSalesFormatted,

        lowStockItemsList,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch manager dashboard",
      error: error.message,
    });
  }
};
/* ==========================================
   12. Cashier Dashboard
   (Today's Sales/Bills/Average Bill/Items Sold,
    Today's Overview payment breakdown, Recent Sales)
========================================== */

exports.getCashierDashboard = async (req, res) => {
  try {
    const { start: todayStart, end: todayEnd } = getTodayRange();
    const { start: yStart, end: yEnd } = getYesterdayRange();

    // ASSUMPTION: req.user is set by verifyToken middleware, and
    // GarmentInvoice stores the creating cashier in `createdBy`.
    // Drop cashierFilter (use {}) if you want store-wide totals instead
    // of "this cashier's" totals.
    const cashierFilter =
      req.user && req.user._id ? { createdBy: req.user._id } : {};

    const [todaySales, todayBills, itemsSoldResult] = await Promise.all([
      sumField(
        GarmentInvoice,
        "invoiceDate",
        todayStart,
        todayEnd,
        "$grandTotal",
        cashierFilter,
      ),
      GarmentInvoice.countDocuments({
        invoiceDate: { $gte: todayStart, $lte: todayEnd },
        ...cashierFilter,
      }),
      GarmentInvoice.aggregate([
        {
          $match: {
            invoiceDate: { $gte: todayStart, $lte: todayEnd },
            ...cashierFilter,
          },
        },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: "$items.quantity" } } },
      ]),
    ]);

    const itemsSold = itemsSoldResult.length ? itemsSoldResult[0].total : 0;
    const averageBill =
      todayBills > 0 ? Number((todaySales / todayBills).toFixed(2)) : 0;

    const [yesterdaySales, yesterdayBills, yItemsSoldResult] =
      await Promise.all([
        sumField(
          GarmentInvoice,
          "invoiceDate",
          yStart,
          yEnd,
          "$grandTotal",
          cashierFilter,
        ),
        GarmentInvoice.countDocuments({
          invoiceDate: { $gte: yStart, $lte: yEnd },
          ...cashierFilter,
        }),
        GarmentInvoice.aggregate([
          {
            $match: {
              invoiceDate: { $gte: yStart, $lte: yEnd },
              ...cashierFilter,
            },
          },
          { $unwind: "$items" },
          { $group: { _id: null, total: { $sum: "$items.quantity" } } },
        ]),
      ]);

    const yItemsSold = yItemsSoldResult.length ? yItemsSoldResult[0].total : 0;
    const yAverageBill =
      yesterdayBills > 0
        ? Number((yesterdaySales / yesterdayBills).toFixed(2))
        : 0;

    // ASSUMPTION: GarmentInvoice.paymentMethod is one of "cash" | "card" | "upi"
    const paymentBreakdown = await GarmentInvoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: todayStart, $lte: todayEnd },
          ...cashierFilter,
        },
      },
      { $group: { _id: "$paymentMethod", total: { $sum: "$grandTotal" } } },
    ]);
    const paymentMap = paymentBreakdown.reduce((acc, p) => {
      acc[p._id || "unknown"] = p.total;
      return acc;
    }, {});

    // ASSUMPTION: GarmentInvoice.discountAmount holds the discount given per sale
    const discountGiven = await sumField(
      GarmentInvoice,
      "invoiceDate",
      todayStart,
      todayEnd,
      "$discountAmount",
      cashierFilter,
    );

    // ASSUMPTION: no Return/Refund model exists yet — stubbed at 0.
    // Wire this up to a real Returns model once one is added.
    const returnsAmount = 0;

    const recentSales = await GarmentInvoice.find({ ...cashierFilter })
      .populate("customer", "customerName")
      .sort({ invoiceDate: -1 })
      .limit(10)
      .select("invoiceNo invoiceDate grandTotal paymentStatus paymentMethod customer");

    const recentSalesFormatted = recentSales.map((s) => ({
      invoiceNo: s.invoiceNo,
      customer: s.customer ? s.customer.customerName : "Walk-in Customer",
      time: s.invoiceDate,
      amount: s.grandTotal,
      payment: s.paymentMethod || "-",
      status: s.paymentStatus,
    }));

    return res.status(200).json({
      success: true,
      message: "Cashier dashboard fetched successfully",
      data: {
        todaySales: {
          amount: todaySales,
          changePercent: percentChange(todaySales, yesterdaySales),
        },
        totalBills: {
          count: todayBills,
          changePercent: percentChange(todayBills, yesterdayBills),
        },
        averageBill: {
          amount: averageBill,
          changePercent: percentChange(averageBill, yAverageBill),
        },
        itemsSold: {
          count: itemsSold,
          changePercent: percentChange(itemsSold, yItemsSold),
        },
        todaysOverview: {
          totalReceipts: todayBills,
          cashReceived: paymentMap.cash || 0,
          cardPayments: paymentMap.card || 0,
          upiPayments: paymentMap.upi || 0,
          returns: returnsAmount,
          discountGiven,
        },
        recentSales: recentSalesFormatted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cashier dashboard",
      error: error.message,
    });
  }
};

/* ==========================================
   13. Inventory Staff Dashboard
   (Total Products, In Stock, Low Stock, Stock Value,
    Stock Summary by category, Recent Stock Activities,
    Low Stock Alerts, Inventory Summary)
========================================== */

exports.getInventoryDashboard = async (req, res) => {
  try {
    const [totalProductsResult, inStockResult, lowStockResult, stockValue] =
      await Promise.all([
        GarmentProduct.aggregate([{ $unwind: "$variants" }, { $count: "count" }]),
        GarmentProduct.aggregate([
          { $unwind: "$variants" },
          { $match: { "variants.currentStock": { $gt: 0 } } },
          { $count: "count" },
        ]),
        GarmentProduct.aggregate([
          { $unwind: "$variants" },
          {
            $match: {
              $expr: {
                $lte: ["$variants.currentStock", "$variants.minimumStock"],
              },
            },
          },
          { $count: "count" },
        ]),
        getInventoryValue(),
      ]);

    const totalProducts = totalProductsResult.length
      ? totalProductsResult[0].count
      : 0;
    const inStock = inStockResult.length ? inStockResult[0].count : 0;
    const lowStock = lowStockResult.length ? lowStockResult[0].count : 0;

    const stockSummaryRaw = await GarmentProduct.aggregate([
      { $unwind: "$variants" },
      {
        $lookup: {
          from: "garmentcategories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$categoryInfo.categoryName", "Uncategorized"] },
          totalStock: { $sum: "$variants.currentStock" },
        },
      },
      { $sort: { totalStock: -1 } },
      { $limit: 5 },
    ]);

    const stockSummary = stockSummaryRaw.map((s) => ({
      category: s._id,
      totalStock: s.totalStock,
    }));

    const [recentStockActivities, lowStockAlerts, totalSuppliers] =
      await Promise.all([
        getRecentStockActivities(10),
        buildLowStockList(10),
        Supplier.countDocuments({ status: true }),
      ]);

    return res.status(200).json({
      success: true,
      message: "Inventory dashboard fetched successfully",
      data: {
        totalProducts,
        inStock,
        lowStock,
        stockValue,
        stockSummary,
        recentStockActivities,
        lowStockAlerts,
        inventorySummary: {
          inventoryValue: stockValue,
          products: totalProducts,
          lowStock,
          suppliers: totalSuppliers,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory dashboard",
      error: error.message,
    });
  }
};