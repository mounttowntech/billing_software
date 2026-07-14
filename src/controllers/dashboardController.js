const mongoose = require("mongoose");

const GarmentInvoice = require("../model/GarmentInvoice");
const Purchase = require("../model/Purchase");
const Expense = require("../model/Expense");
const Payment = require("../model/Payment");
const GarmentProduct = require("../model/GarmentProduct");
const GarmentCustomer = require("../model/GarmentCustomer");
const Supplier = require("../model/supplierModel");
const GarmentCategory = require("../model/GarmentCategory");

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

async function sumField(Model, dateField, startDate, endDate, sumExpr, extraMatch = {}) {
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

/* ==========================================
   1. Dashboard Summary Cards
   (Total Sales, Total Purchases, Gross Profit, Net Profit)
========================================== */

exports.getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = resolveDateRange(req.query);
    const { prevStartDate, prevEndDate } = getPreviousPeriod(startDate, endDate);

    const [totalSales, totalPurchases, totalExpenses] = await Promise.all([
      sumField(GarmentInvoice, "invoiceDate", startDate, endDate, "$grandTotal"),
      sumField(Purchase, "purchaseDate", startDate, endDate, "$grandTotal"),
      sumField(Expense, "expenseDate", startDate, endDate, "$amount"),
    ]);

    const [prevSales, prevPurchases, prevExpenses] = await Promise.all([
      sumField(GarmentInvoice, "invoiceDate", prevStartDate, prevEndDate, "$grandTotal"),
      sumField(Purchase, "purchaseDate", prevStartDate, prevEndDate, "$grandTotal"),
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
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

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
      percentage: grandTotal > 0 ? Number(((d.total / grandTotal) * 100).toFixed(2)) : 0,
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
    const [totalCustomers, totalSuppliers, lowStockResult, dueResult] = await Promise.all([
      GarmentCustomer.countDocuments({ status: "active" }),
      Supplier.countDocuments({ status: true }),

      GarmentProduct.aggregate([
        { $unwind: "$variants" },
        {
          $match: {
            $expr: { $lte: ["$variants.currentStock", "$variants.minimumStock"] },
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

    const data = await GarmentProduct.aggregate([
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
            $cond: [{ $eq: ["$variants.currentStock", 0] }, "Out of Stock", "Low Stock"],
          },
        },
      },
      { $sort: { currentStock: 1 } },
      { $limit: limit },
    ]);

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