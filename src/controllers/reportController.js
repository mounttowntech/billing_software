const Invoice = require("../model/invoiceModel");
const Purchase = require("../model/purchaseModel");
const Expense = require("../model/expenseModel");
const Product = require("../model/productModel");
const Customer = require("../model/customerModel");
const Supplier = require("../model/supplierModel");
const StockLedger = require("../model/stockledger");

// ===============================
// DATE FILTER HELPER
// ===============================

const getDateFilter = (fromDate, toDate, field = "createdAt") => {
  const filter = {};

  if (fromDate || toDate) {
    filter[field] = {};

    if (fromDate) {
      filter[field].$gte = new Date(fromDate);
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }

  return filter;
};

// ===============================
// SALES REPORT
// GET /api/reports/sales?fromDate=2026-06-01&toDate=2026-06-30
// ===============================

exports.getSalesReport = async (req, res) => {
  try {
    const { fromDate, toDate, industryType, paymentStatus } = req.query;

    const filter = {
      ...getDateFilter(fromDate, toDate),
    };

    if (industryType) filter.industryType = industryType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const invoices = await Invoice.find(filter)
      .populate("customer", "name phone email")
      .populate("items.product items.variant")
      .sort({ createdAt: -1 });

    const summary = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          subTotal: { $sum: "$subTotal" },
          gstTotal: { $sum: "$gstTotal" },
          discount: { $sum: "$discount" },
          grandTotal: { $sum: "$grandTotal" },
          paidAmount: { $sum: "$paidAmount" },
          dueAmount: { $sum: "$dueAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      summary: summary[0] || {
        totalInvoices: 0,
        subTotal: 0,
        gstTotal: 0,
        discount: 0,
        grandTotal: 0,
        paidAmount: 0,
        dueAmount: 0,
      },
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// PURCHASE REPORT
// GET /api/reports/purchases?fromDate=2026-06-01&toDate=2026-06-30
// ===============================

exports.getPurchaseReport = async (req, res) => {
  try {
    const { fromDate, toDate, paymentStatus } = req.query;

    const filter = {
      ...getDateFilter(fromDate, toDate),
    };

    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const purchases = await Purchase.find(filter)
      .populate("supplier", "name phone email")
      .populate("items.product items.variant")
      .sort({ createdAt: -1 });

    const summary = await Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          subTotal: { $sum: "$subTotal" },
          gstTotal: { $sum: "$gstTotal" },
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
          dueAmount: { $sum: "$dueAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      summary: summary[0] || {
        totalPurchases: 0,
        subTotal: 0,
        gstTotal: 0,
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      },
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// EXPENSE REPORT
// GET /api/reports/expenses?fromDate=2026-06-01&toDate=2026-06-30
// ===============================

exports.getExpenseReport = async (req, res) => {
  try {
    const { fromDate, toDate, category } = req.query;

    const filter = {
      ...getDateFilter(fromDate, toDate, "expenseDate"),
    };

    if (category) filter.category = category;

    const expenses = await Expense.find(filter).sort({ expenseDate: -1 });

    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalExpense = summary.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );

    res.json({
      success: true,
      totalExpense,
      categorySummary: summary,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// GST REPORT
// GET /api/reports/gst?fromDate=2026-06-01&toDate=2026-06-30
// ===============================

exports.getGSTReport = async (req, res) => {
  try {
    const { fromDate, toDate, industryType } = req.query;

    const filter = {
      ...getDateFilter(fromDate, toDate),
    };

    if (industryType) filter.industryType = industryType;

    const report = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$industryType",
          taxableAmount: { $sum: "$subTotal" },
          cgst: { $sum: "$cgst" },
          sgst: { $sum: "$sgst" },
          igst: { $sum: "$igst" },
          gstTotal: { $sum: "$gstTotal" },
          grandTotal: { $sum: "$grandTotal" },
        },
      },
      { $sort: { grandTotal: -1 } },
    ]);

    const total = report.reduce(
      (acc, item) => {
        acc.taxableAmount += item.taxableAmount || 0;
        acc.cgst += item.cgst || 0;
        acc.sgst += item.sgst || 0;
        acc.igst += item.igst || 0;
        acc.gstTotal += item.gstTotal || 0;
        acc.grandTotal += item.grandTotal || 0;
        return acc;
      },
      {
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        gstTotal: 0,
        grandTotal: 0,
      }
    );

    res.json({
      success: true,
      total,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// PROFIT REPORT
// Sales - Purchase - Expense
// GET /api/reports/profit?fromDate=2026-06-01&toDate=2026-06-30
// ===============================

exports.getProfitReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const invoiceFilter = getDateFilter(fromDate, toDate);
    const purchaseFilter = getDateFilter(fromDate, toDate);
    const expenseFilter = getDateFilter(fromDate, toDate, "expenseDate");

    const sales = await Invoice.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalSalesDue: { $sum: "$dueAmount" },
        },
      },
    ]);

    const purchases = await Purchase.aggregate([
      { $match: purchaseFilter },
      {
        $group: {
          _id: null,
          totalPurchase: { $sum: "$totalAmount" },
          totalPurchaseDue: { $sum: "$dueAmount" },
        },
      },
    ]);

    const expenses = await Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    const totalSales = sales[0]?.totalSales || 0;
    const totalPurchase = purchases[0]?.totalPurchase || 0;
    const totalExpense = expenses[0]?.totalExpense || 0;

    res.json({
      success: true,
      data: {
        totalSales,
        totalPurchase,
        totalExpense,
        grossProfit: totalSales - totalPurchase,
        netProfit: totalSales - totalPurchase - totalExpense,
        totalSalesDue: sales[0]?.totalSalesDue || 0,
        totalPurchaseDue: purchases[0]?.totalPurchaseDue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// TOP SELLING PRODUCTS
// GET /api/reports/top-selling?limit=10
// ===============================

exports.getTopSellingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const products = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalAmount: { $sum: "$items.totalAmount" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// LOW STOCK REPORT
// GET /api/reports/low-stock
// ===============================

exports.getLowStockReport = async (req, res) => {
  try {
    const products = await Product.find({
      hasVariants: false,
      $expr: { $lte: ["$stockQuantity", "$lowStockLimit"] },
    }).sort({ stockQuantity: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// CUSTOMER DUE REPORT
// GET /api/reports/customer-due
// ===============================

exports.getCustomerDueReport = async (req, res) => {
  try {
    const customers = await Customer.find({
      dueAmount: { $gt: 0 },
    }).sort({ dueAmount: -1 });

    const totalDue = customers.reduce(
      (sum, item) => sum + Number(item.dueAmount || 0),
      0
    );

    res.json({
      success: true,
      totalDue,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// SUPPLIER DUE REPORT
// GET /api/reports/supplier-due
// ===============================

exports.getSupplierDueReport = async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      dueAmount: { $gt: 0 },
    }).sort({ dueAmount: -1 });

    const totalDue = suppliers.reduce(
      (sum, item) => sum + Number(item.dueAmount || 0),
      0
    );

    res.json({
      success: true,
      totalDue,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// STOCK MOVEMENT REPORT
// GET /api/reports/stock-movement?productId=xxx
// ===============================

exports.getStockMovementReport = async (req, res) => {
  try {
    const { productId, movementType, fromDate, toDate } = req.query;

    const filter = {
      ...getDateFilter(fromDate, toDate),
    };

    if (productId) filter.product = productId;
    if (movementType) filter.movementType = movementType;

    const stock = await StockLedger.find(filter)
      .populate("product variant")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stock.length,
      data: stock,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};