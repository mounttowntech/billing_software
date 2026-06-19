const Invoice = require("../models/Invoice");
const Purchase = require("../models/Purchase");
const Expense = require("../models/Expense");
const Product = require("../models/Product");

exports.getDashboardSummary = async () => {
  const sales = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$grandTotal" },
        totalDue: { $sum: "$dueAmount" },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  const purchases = await Purchase.aggregate([
    {
      $group: {
        _id: null,
        totalPurchase: { $sum: "$totalAmount" },
        totalDue: { $sum: "$dueAmount" },
        purchaseCount: { $sum: 1 },
      },
    },
  ]);

  const expenses = await Expense.aggregate([
    {
      $group: {
        _id: null,
        totalExpense: { $sum: "$amount" },
        expenseCount: { $sum: 1 },
      },
    },
  ]);

  const lowStockProducts = await Product.find({
    hasVariants: false,
    $expr: { $lte: ["$stockQuantity", "$lowStockLimit"] },
  }).limit(10);

  return {
    sales: sales[0] || {
      totalSales: 0,
      totalDue: 0,
      invoiceCount: 0,
    },
    purchases: purchases[0] || {
      totalPurchase: 0,
      totalDue: 0,
      purchaseCount: 0,
    },
    expenses: expenses[0] || {
      totalExpense: 0,
      expenseCount: 0,
    },
    lowStockProducts,
  };
};

exports.getGSTReport = async () => {
  const report = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        taxableAmount: { $sum: "$subTotal" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
        igst: { $sum: "$igst" },
        gstTotal: { $sum: "$gstTotal" },
        grandTotal: { $sum: "$grandTotal" },
      },
    },
  ]);

  return report[0] || {
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gstTotal: 0,
    grandTotal: 0,
  };
};

exports.getTopSellingProducts = async () => {
  return Invoice.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        quantity: { $sum: "$items.quantity" },
        amount: { $sum: "$items.totalAmount" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
  ]);
};