const mongoose = require("mongoose");
const ExcelJS = require("exceljs");

// Models
const GarmentInvoice = require("../model/GarmentInvoice");
const Purchase = require("../model/Purchase");
const Expense = require("../model/Expense");
const Payment = require("../model/Payment");
const GarmentProduct = require("../model/GarmentProduct");
const GarmentCustomer = require("../model/GarmentCustomer");
const Supplier = require("../model/supplierModel");
const StockLedger = require("../model/StockLedger");


// ============================================================================
// Helper Functions
// ============================================================================

function resolveDateRange(req) {
  const { from, to } = req.query;

  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000);

  fromDate.setHours(0, 0, 0, 0);

  return {
    fromDate,
    toDate,
  };
}


// ============================================================================

function previousPeriod(fromDate, toDate) {

  const diff =
    toDate.getTime() -
    fromDate.getTime();

  const prevTo =
    new Date(fromDate.getTime() - 1);

  const prevFrom =
    new Date(prevTo.getTime() - diff);

  return {
    prevFrom,
    prevTo,
  };
}


// ============================================================================

function pctChange(current, previous) {

  if (!previous)
    return current > 0 ? 100 : 0;

  return Number(
    (
      ((current - previous) /
        previous) *
      100
    ).toFixed(2)
  );

}


// ============================================================================

function formatCurrency(amount) {

  return Number(amount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

}


// ============================================================================

function formatDate(date) {

  if (!date) return "";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

}


// ============================================================================

async function sumInRange(
  Model,
  field,
  fromDate,
  toDate,
  extraMatch = {}
) {

  const result = await Model.aggregate([
    {
      $match: {
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
        ...extraMatch,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: `$${field}`,
        },
      },
    },
  ]);

  return result[0]?.total || 0;

}
// ============================================================================
// 1. GET /api/reports/summary
// Dashboard Summary
// ============================================================================
// ============================================================================
// Ledger Pipeline Builder
// ============================================================================

function buildLedgerPipeline(fromDate, toDate) {

  return [

    // ==========================
    // Expense Collection Base
    // ==========================

    {
      $match: {
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      },
    },


    {
      $project: {

        _id: 0,

        type: {
          $literal: "Expense",
        },

        referenceNo:
          "$expenseNo",

        date:
          "$createdAt",

        party:
          "$category",

        netAmount: {
          $multiply: [
            "$amount",
            -1,
          ],
        },

      },

    },


    // ==========================
    // Add Sales
    // ==========================

    {
      $unionWith: {

        coll: "garmentinvoices",

        pipeline: [

          {
            $match: {

              createdAt: {
                $gte: fromDate,
                $lte: toDate,
              },

            },

          },

          {
            $project: {

              _id:0,

              type:{
                $literal:"Sale",
              },

              referenceNo:
                "$invoiceNo",

              date:
                "$invoiceDate",

              party:
                "$customerName",

              netAmount:
                "$grandTotal",

            },

          },

        ],

      },

    },


    // ==========================
    // Add Purchase
    // ==========================

    {
      $unionWith: {

        coll:"purchases",

        pipeline:[

          {
            $match:{

              createdAt:{
                $gte:fromDate,
                $lte:toDate,
              },

            },

          },


          {
            $project:{

              _id:0,

              type:{
                $literal:"Purchase",
              },


              referenceNo:
                "$purchaseNo",


              date:
                "$purchaseDate",


              party:
                "$supplierName",


              netAmount:{
                $multiply:[
                  "$grandTotal",
                  -1
                ],
              },


            },

          },

        ],

      },

    },


    // ==========================
    // Add Payments
    // ==========================

    {
      $unionWith:{

        coll:"payments",

        pipeline:[

          {
            $match:{

              createdAt:{
                $gte:fromDate,
                $lte:toDate,
              },

            },

          },


          {
            $project:{

              _id:0,

              type:{
                $literal:"Payment",
              },


              referenceNo:
                "$paymentNo",


              date:
                "$paymentDate",


              party:
                "$partyName",


              netAmount:
                "$amount",

            },

          },

        ],

      },

    },


    // ==========================
    // Sort Ledger
    // ==========================

    {
      $sort:{
        date:1,
      },
    },


  ];

}
exports.getReportsSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = resolveDateRange(req);
    const { prevFrom, prevTo } = previousPeriod(fromDate, toDate);

    const [
      totalSales,
      previousSales,
      totalPurchases,
      previousPurchases,
      totalExpenses,
      previousExpenses,
      lowStockItems,
      recentSales,
    ] = await Promise.all([

      // Sales
      sumInRange(
        GarmentInvoice,
        "grandTotal",
        fromDate,
        toDate
      ),

      sumInRange(
        GarmentInvoice,
        "grandTotal",
        prevFrom,
        prevTo
      ),

      // Purchases
      sumInRange(
        Purchase,
        "grandTotal",
        fromDate,
        toDate
      ),

      sumInRange(
        Purchase,
        "grandTotal",
        prevFrom,
        prevTo
      ),

      // Expenses
      sumInRange(
        Expense,
        "amount",
        fromDate,
        toDate
      ),

      sumInRange(
        Expense,
        "amount",
        prevFrom,
        prevTo
      ),

      // Low Stock
      GarmentProduct.countDocuments({
        $expr: {
          $lte: [
            "$stockQty",
            "$reorderLevel",
          ],
        },
      }),

      // Recent Sales
      GarmentInvoice.find({
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
        .populate(
          "customer",
          "customerName"
        )
        .sort({
          invoiceDate: -1,
        })
        .limit(10)
        .select(
          "invoiceNo invoiceDate grandTotal paidAmount dueAmount paymentStatus paymentMethod customer"
        ),
    ]);

    const netProfit =
      totalSales -
      totalPurchases -
      totalExpenses;

    const previousNetProfit =
      previousSales -
      previousPurchases -
      previousExpenses;

    res.status(200).json({
      success: true,

      period: {
        from: fromDate,
        to: toDate,
      },

      totalSales: {
        value: totalSales,
        formatted: formatCurrency(totalSales),
        change: pctChange(
          totalSales,
          previousSales
        ),
      },

      totalPurchases: {
        value: totalPurchases,
        formatted: formatCurrency(
          totalPurchases
        ),
        change: pctChange(
          totalPurchases,
          previousPurchases
        ),
      },

      totalExpenses: {
        value: totalExpenses,
        formatted: formatCurrency(
          totalExpenses
        ),
        change: pctChange(
          totalExpenses,
          previousExpenses
        ),
      },

      netProfit: {
        value: netProfit,
        formatted: formatCurrency(
          netProfit
        ),
        change: pctChange(
          netProfit,
          previousNetProfit
        ),
      },

      lowStockItems,

      recentSales: recentSales.map(
        (invoice) => ({
          invoiceNo:
            invoice.invoiceNo,

          customer:
            invoice.customer
              ?.customerName ||
            "Walk-in",

          date:
            invoice.invoiceDate,

          total:
            invoice.grandTotal,

          paid:
            invoice.paidAmount,

          due:
            invoice.dueAmount,

          paymentMethod:
            invoice.paymentMethod,

          paymentStatus:
            invoice.paymentStatus,
        })
      ),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard summary",
      error: err.message,
    });
  }
};
// ============================================================================
// 2. GET /api/reports/analytics
// Professional Dashboard Analytics
// ============================================================================

exports.getReportsAnalytics = async (
  req,
  res
) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalInvoices,
      lowStockItems,

      salesDue,

      purchaseDue,

      totalInventoryValue,
    ] = await Promise.all([

      GarmentProduct.countDocuments(),

      GarmentCustomer.countDocuments(),

      Supplier.countDocuments(),

      GarmentInvoice.countDocuments(),

      GarmentProduct.countDocuments({
        $expr: {
          $lte: [
            "$stockQty",
            "$reorderLevel",
          ],
        },
      }),

      GarmentInvoice.aggregate([
        {
          $match: {
            dueAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$dueAmount",
            },
          },
        },
      ]),

      Purchase.aggregate([
        {
          $match: {
            dueAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$dueAmount",
            },
          },
        },
      ]),

      GarmentProduct.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  "$stockQty",
                  "$purchasePrice",
                ],
              },
            },
          },
        },
      ]),
    ]);

    const customerDue =
      salesDue[0]?.total || 0;

    const supplierDue =
      purchaseDue[0]?.total || 0;

    const inventoryValue =
      totalInventoryValue[0]?.total ||
      0;

    res.status(200).json({
      success: true,

      analytics: {

        totalProducts,

        totalCustomers,

        totalSuppliers,

        totalInvoices,

        lowStockItems,

        customerDue,

        supplierDue,

        totalDue:
          customerDue +
          supplierDue,

        inventoryValue,

        formatted: {

          customerDue:
            formatCurrency(
              customerDue
            ),

          supplierDue:
            formatCurrency(
              supplierDue
            ),

          totalDue:
            formatCurrency(
              customerDue +
                supplierDue
            ),

          inventoryValue:
            formatCurrency(
              inventoryValue
            ),
        },
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard analytics",
      error: err.message,
    });
  }
};
// ============================================================================
// 3. GET /api/reports/sales-trend
// Daily / Weekly / Monthly Sales Trend
// ============================================================================

exports.getSalesTrend = async (req, res) => {
  try {
    const { fromDate, toDate } = resolveDateRange(req);

    const period = req.query.period || "daily";
    const { prevFrom, prevTo } = previousPeriod(
      fromDate,
      toDate
    );

    let dateFormat = "%d-%m-%Y";

    if (period === "monthly") {
      dateFormat = "%m-%Y";
    }

    if (period === "yearly") {
      dateFormat = "%Y";
    }

    const buildTrend = async (start, end) => {
      return await GarmentInvoice.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: "$invoiceDate",
              },
            },
            totalSales: {
              $sum: "$grandTotal",
            },
            totalInvoices: {
              $sum: 1,
            },
            totalItems: {
              $sum: {
                $size: "$items",
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);
    };

    const [current, previous] =
      await Promise.all([
        buildTrend(fromDate, toDate),
        buildTrend(prevFrom, prevTo),
      ]);

    const totalSales = current.reduce(
      (sum, row) => sum + row.totalSales,
      0
    );

    const totalInvoices = current.reduce(
      (sum, row) => sum + row.totalInvoices,
      0
    );

    res.json({
      success: true,

      period,

      from: fromDate,

      to: toDate,

      totalSales,

      totalInvoices,

      current,

      previous,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Failed to load sales trend",
      error: err.message,
    });
  }
};
// ============================================================================
// 4. GET /api/reports/sales-by-category
// Product Wise Sales Report
// ============================================================================

exports.getSalesByCategory = async (req, res) => {
  try {

    const { fromDate, toDate } = resolveDateRange(req);

    const categories = await GarmentInvoice.aggregate([

      {
        $match: {
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {

          _id: "$items.product",

          productName: {
            $first: "$items.productName",
          },

          skuCode: {
            $first: "$items.skuCode",
          },

          barcode: {
            $first: "$items.barcode",
          },

          quantitySold: {
            $sum: "$items.quantity",
          },

          totalSales: {
            $sum: "$items.totalAmount",
          },

          totalGST: {
            $sum: "$items.gstAmount",
          },

          invoiceCount: {
            $sum: 1,
          },

        },
      },

      {
        $lookup: {

          from: "garmentproducts",

          localField: "_id",

          foreignField: "_id",

          as: "product",

        },
      },

      {
        $project: {

          _id: 0,

          productId: "$_id",

          productName: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.productName",
                  0,
                ],
              },
              "$productName",
            ],
          },

          skuCode: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.skuCode",
                  0,
                ],
              },
              "$skuCode",
            ],
          },

          barcode: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.barcode",
                  0,
                ],
              },
              "$barcode",
            ],
          },

          quantitySold: 1,

          totalSales: 1,

          totalGST: 1,

          invoiceCount: 1,

          averagePrice: {

            $cond: [

              {
                $eq: [
                  "$quantitySold",
                  0,
                ],
              },

              0,

              {
                $divide: [
                  "$totalSales",
                  "$quantitySold",
                ],
              },

            ],

          },

          currentStock: {

            $ifNull: [

              {
                $arrayElemAt: [
                  "$product.stockQty",
                  0,
                ],
              },

              0,

            ],

          },

          reorderLevel: {

            $ifNull: [

              {
                $arrayElemAt: [
                  "$product.reorderLevel",
                  0,
                ],
              },

              0,

            ],

          },

        },
      },

      {
        $sort: {
          totalSales: -1,
        },
      },

    ]);



    // ======================================================
    // Overall Summary
    // ======================================================

    const totalSales = categories.reduce(
      (sum, item) => sum + item.totalSales,
      0
    );

    const totalQuantity = categories.reduce(
      (sum, item) => sum + item.quantitySold,
      0
    );

    const totalGST = categories.reduce(
      (sum, item) => sum + item.totalGST,
      0
    );



    // ======================================================
    // Percentage Calculation
    // ======================================================

    const result = categories.map((item) => ({

      ...item,

      sharePercentage:

        totalSales === 0
          ? 0
          : Number(
              (
                (item.totalSales /
                  totalSales) *
                100
              ).toFixed(2)
            ),

      averagePrice:
        Number(
          item.averagePrice.toFixed(2)
        ),

    }));



    // ======================================================
    // Top Selling Product
    // ======================================================

    const topProduct =
      result.length > 0
        ? result[0]
        : null;



    res.status(200).json({

      success: true,

      reportPeriod: {

        from: fromDate,

        to: toDate,

      },

      summary: {

        totalProducts:
          result.length,

        totalSales,

        totalQuantity,

        totalGST,

        formattedSales:
          formatCurrency(
            totalSales
          ),

        formattedGST:
          formatCurrency(
            totalGST
          ),

      },

      topProduct,

      categories: result,

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      message:
        "Failed to load sales by category",

      error: err.message,

    });

  }
};
// ============================================================================
// 5. GET /api/reports/sales-summary
// Professional Ledger Summary
// ============================================================================

exports.getSalesSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = resolveDateRange(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // =====================================================
    // Ledger Data
    // =====================================================

    const pipeline = buildLedgerPipeline(fromDate, toDate);

    pipeline.push(
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],

          totals: [
            {
              $group: {
                _id: null,

                totalRecords: {
                  $sum: 1,
                },

                totalDebit: {
                  $sum: {
                    $cond: [
                      {
                        $lt: ["$netAmount", 0],
                      },
                      {
                        $abs: "$netAmount",
                      },
                      0,
                    ],
                  },
                },

                totalCredit: {
                  $sum: {
                    $cond: [
                      {
                        $gt: ["$netAmount", 0],
                      },
                      "$netAmount",
                      0,
                    ],
                  },
                },

                netAmount: {
                  $sum: "$netAmount",
                },
              },
            },
          ],
        },
      }
    );

    const result = await Expense.aggregate(pipeline);

    const rows = result[0]?.data || [];

    const totals = result[0]?.totals[0] || {
      totalRecords: 0,
      totalDebit: 0,
      totalCredit: 0,
      netAmount: 0,
    };

    // =====================================================
    // Format Rows
    // =====================================================

    const formattedRows = rows.map((row, index) => {
      const amount = Number(row.netAmount || 0);

      return {
        sno: skip + index + 1,

        type: row.type,

        referenceNo: row.referenceNo || "-",

        date: row.date,

        party: row.party || "-",

        debit:
          amount < 0
            ? Math.abs(amount)
            : 0,

        credit:
          amount > 0
            ? amount
            : 0,

        netAmount: amount,
      };
    });

    // =====================================================
    // Response
    // =====================================================

    res.json({
      success: true,

      page,

      limit,

      totalPages: Math.ceil(
        totals.totalRecords / limit
      ),

      totalRecords: totals.totalRecords,

      summary: {
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        netAmount: totals.netAmount,
      },

      rows: formattedRows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to load sales summary",
      error: err.message,
    });
  }
};
// ============================================================================
// 6. GET /api/reports/top-products
// Professional Top Selling Products Report
// ============================================================================

exports.getTopSellingProducts = async (req, res) => {
  try {
    const { fromDate, toDate } = resolveDateRange(req);

    const limit = Number(req.query.limit) || 10;

    const products = await GarmentInvoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          productName: {
            $first: "$items.productName",
          },

          skuCode: {
            $first: "$items.skuCode",
          },

          barcode: {
            $first: "$items.barcode",
          },

          quantitySold: {
            $sum: "$items.quantity",
          },

          totalSales: {
            $sum: "$items.totalAmount",
          },

          invoiceCount: {
            $sum: 1,
          },

          gstCollected: {
            $sum: "$items.gstAmount",
          },

          averageSellingPrice: {
            $avg: "$items.price",
          },
        },
      },

      {
        $sort: {
          totalSales: -1,
        },
      },

      {
        $limit: limit,
      },

      {
        $lookup: {
          from: "garmentproducts",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },

      {
        $project: {
          _id: 0,

          productId: "$_id",

          productName: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.productName",
                  0,
                ],
              },
              "$productName",
            ],
          },

          skuCode: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.skuCode",
                  0,
                ],
              },
              "$skuCode",
            ],
          },

          barcode: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.barcode",
                  0,
                ],
              },
              "$barcode",
            ],
          },

          quantitySold: 1,

          totalSales: 1,

          invoiceCount: 1,

          gstCollected: 1,

          averageSellingPrice: {
            $round: [
              "$averageSellingPrice",
              2,
            ],
          },

          currentStock: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.stockQty",
                  0,
                ],
              },
              0,
            ],
          },

          reorderLevel: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.reorderLevel",
                  0,
                ],
              },
              0,
            ],
          },

          category: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.category",
                  0,
                ],
              },
              "-",
            ],
          },

          brand: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$product.brand",
                  0,
                ],
              },
              "-",
            ],
          },
        },
      },
    ]);

    // ==========================================================
    // Overall Summary
    // ==========================================================

    const totalSales = products.reduce(
      (sum, item) => sum + item.totalSales,
      0
    );

    const totalQuantitySold = products.reduce(
      (sum, item) => sum + item.quantitySold,
      0
    );

    const totalGSTCollected = products.reduce(
      (sum, item) => sum + item.gstCollected,
      0
    );

    // ==========================================================
    // Add Sales Contribution %
    // ==========================================================

    const finalProducts = products.map((item, index) => ({
      rank: index + 1,

      ...item,

      salesContribution:
        totalSales === 0
          ? 0
          : Number(
              (
                (item.totalSales / totalSales) *
                100
              ).toFixed(2)
            ),

      stockStatus:
        item.currentStock <= item.reorderLevel
          ? "Low Stock"
          : "Available",
    }));

    res.json({
      success: true,

      reportRange: {
        from: fromDate,
        to: toDate,
      },

      summary: {
        totalProducts: finalProducts.length,
        totalQuantitySold,
        totalSales,
        totalGSTCollected,
      },

      products: finalProducts,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to load top selling products",
      error: err.message,
    });
  }
};
exports.exportReport = async (req, res) => {
  try {
    const { fromDate, toDate } = resolveDateRange(req);

    // ============================================
    // Get Ledger
    // ============================================

    const pipeline = buildLedgerPipeline(fromDate, toDate);

    const rows = await Expense.aggregate(pipeline);

    // ============================================
    // Summary Calculation
    // ============================================

    let totalSales = 0;
    let totalPurchases = 0;
    let totalExpenses = 0;
    let totalPayments = 0;

    rows.forEach((row) => {
      const amount = Number(row.netAmount || 0);

      switch (row.type) {
        case "Sale":
          totalSales += amount;
          break;

        case "Purchase":
          totalPurchases += Math.abs(amount);
          break;

        case "Expense":
          totalExpenses += Math.abs(amount);
          break;

        case "Payment":
          totalPayments += amount;
          break;
      }
    });

    const netProfit =
      totalSales -
      totalPurchases -
      totalExpenses;

    // ============================================
    // Workbook
    // ============================================

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Garment Billing Software";
    workbook.company = "Garment Billing Software";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      "Sales Report",
      {
        views: [
          {
            state: "frozen",
            ySplit: 14,
          },
        ],
      }
    );

   // ============================================================
// Company Header
// ============================================================

sheet.mergeCells("A1:G1");
sheet.getCell("A1").value = "GARMENT BILLING SOFTWARE";
sheet.getCell("A1").font = {
  size: 20,
  bold: true,
  color: { argb: "FFFFFFFF" },
};

sheet.getCell("A1").alignment = {
  horizontal: "center",
  vertical: "middle",
};

sheet.getCell("A1").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    argb: "1F4E78",
  },
};

sheet.mergeCells("A2:G2");
sheet.getCell("A2").value = "Sales & Financial Report";

sheet.getCell("A2").font = {
  size: 14,
  bold: true,
};

sheet.getCell("A2").alignment = {
  horizontal: "center",
};

// ============================================================
// Report Information
// ============================================================

sheet.getCell("A4").value = "Report From";
sheet.getCell("B4").value = formatDate(fromDate);

sheet.getCell("D4").value = "To";
sheet.getCell("E4").value = formatDate(toDate);

sheet.getCell("A5").value = "Generated On";
sheet.getCell("B5").value = formatDate(new Date());

["A4", "A5", "D4"].forEach((cell) => {
  sheet.getCell(cell).font = {
    bold: true,
  };
});

// ============================================================
// Summary Section
// ============================================================

sheet.mergeCells("A7:G7");

sheet.getCell("A7").value = "SUMMARY";

sheet.getCell("A7").font = {
  bold: true,
  color: {
    argb: "FFFFFFFF",
  },
};

sheet.getCell("A7").alignment = {
  horizontal: "center",
};

sheet.getCell("A7").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    argb: "2F75B5",
  },
};

sheet.getCell("A8").value = "Total Sales";
sheet.getCell("B8").value = totalSales;

sheet.getCell("A9").value = "Total Purchases";
sheet.getCell("B9").value = totalPurchases;

sheet.getCell("A10").value = "Total Expenses";
sheet.getCell("B10").value = totalExpenses;

sheet.getCell("A11").value = "Total Payments";
sheet.getCell("B11").value = totalPayments;

sheet.getCell("A12").value = "Net Profit";
sheet.getCell("B12").value = netProfit;

// Currency Format

for (let i = 8; i <= 12; i++) {

  sheet.getCell(`A${i}`).font = {
    bold: true,
  };

  sheet.getCell(`B${i}`).numFmt = '#,##0.00';

}

// ============================================================
// Ledger Header
// ============================================================

const headerRow = 14;

sheet.getRow(headerRow).values = [
  "Type",
  "Reference No",
  "Date",
  "Party",
  "Debit",
  "Credit",
  "Net Amount",
];

sheet.getRow(headerRow).font = {
  bold: true,
  color: {
    argb: "FFFFFFFF",
  },
};

sheet.getRow(headerRow).alignment = {
  horizontal: "center",
};

sheet.getRow(headerRow).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    argb: "4472C4",
  },
};
// ============================================================
// Ledger Rows
// ============================================================

let rowIndex = 15;

let totalDebit = 0;
let totalCredit = 0;

rows.forEach((row) => {

  const amount = Number(row.netAmount || 0);

  let debit = 0;
  let credit = 0;

  if (row.type === "Purchase" || row.type === "Expense") {
    debit = Math.abs(amount);
    totalDebit += debit;
  }

  if (row.type === "Sale" || row.type === "Payment") {
    credit = Math.abs(amount);
    totalCredit += credit;
  }

  sheet.addRow([
    row.type,
    row.referenceNo || "",
    formatDate(row.date),
    row.party || "-",
    debit,
    credit,
    amount,
  ]);

  const excelRow = sheet.getRow(rowIndex);

  // Number Formatting
  excelRow.getCell(5).numFmt = '#,##0.00';
  excelRow.getCell(6).numFmt = '#,##0.00';
  excelRow.getCell(7).numFmt = '#,##0.00';

  // Alignment
  excelRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  // Borders
  excelRow.eachCell((cell) => {
    cell.border = {
      top: {
        style: "thin",
      },
      left: {
        style: "thin",
      },
      bottom: {
        style: "thin",
      },
      right: {
        style: "thin",
      },
    };
  });

  // Alternate Row Color
  if (rowIndex % 2 === 0) {
    excelRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "F8F9FA",
      },
    };
  }

  // Sale Row (Green)
  if (row.type === "Sale") {
    excelRow.getCell(1).font = {
      color: {
        argb: "008000",
      },
      bold: true,
    };
  }

  // Purchase Row (Red)
  if (row.type === "Purchase") {
    excelRow.getCell(1).font = {
      color: {
        argb: "C00000",
      },
      bold: true,
    };
  }

  // Expense Row (Orange)
  if (row.type === "Expense") {
    excelRow.getCell(1).font = {
      color: {
        argb: "E46C0A",
      },
      bold: true,
    };
  }

  // Payment Row (Blue)
  if (row.type === "Payment") {
    excelRow.getCell(1).font = {
      color: {
        argb: "1F4E78",
      },
      bold: true,
    };
  }

  rowIndex++;
});

// ============================================================
// Grand Total Row
// ============================================================

const totalRow = sheet.addRow([
  "",
  "",
  "",
  "GRAND TOTAL",
  totalDebit,
  totalCredit,
  netProfit,
]);

totalRow.font = {
  bold: true,
  color: {
    argb: "FFFFFFFF",
  },
};

totalRow.alignment = {
  horizontal: "center",
};

totalRow.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    argb: "1F4E78",
  },
};

totalRow.eachCell((cell) => {

  cell.border = {
    top: {
      style: "medium",
    },
    left: {
      style: "thin",
    },
    bottom: {
      style: "medium",
    },
    right: {
      style: "thin",
    },
  };

});

totalRow.getCell(5).numFmt = '#,##0.00';
totalRow.getCell(6).numFmt = '#,##0.00';
totalRow.getCell(7).numFmt = '#,##0.00';

// ============================================================
// Auto Column Width
// ============================================================

sheet.columns = [
  {
    header: "Type",
    key: "type",
    width: 18,
  },
  {
    header: "Reference",
    key: "reference",
    width: 20,
  },
  {
    header: "Date",
    key: "date",
    width: 18,
  },
  {
    header: "Party",
    key: "party",
    width: 35,
  },
  {
    header: "Debit",
    key: "debit",
    width: 18,
  },
  {
    header: "Credit",
    key: "credit",
    width: 18,
  },
  {
    header: "Net Amount",
    key: "net",
    width: 20,
  },
];

// ============================================================
// Page Setup
// ============================================================

sheet.pageSetup = {
  paperSize: 9,
  orientation: "landscape",
  fitToPage: true,
  fitToWidth: 1,
};

// ============================================================
// Footer
// ============================================================

sheet.footerFooter = "&CGenerated by Garment Billing Software";

// ============================================================
// Download Excel
// ============================================================

const fileName = `Sales_Report_${Date.now()}.xlsx`;

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
  "Content-Disposition",
  `attachment; filename=${fileName}`
);

await workbook.xlsx.write(res);

// ============================================================
// Auto Filter
// ============================================================

sheet.autoFilter = {
  from: "A14",
  to: "G14",
};



// ============================================================
// Freeze Pane
// ============================================================

sheet.views = [
  {
    state: "frozen",
    ySplit: 14,
    activeCell: "A15",
  },
];



// ============================================================
// Header Footer
// ============================================================

sheet.headerFooter = {

  oddHeader:
    "&C&\"Arial,Bold\"GARMENT BILLING SOFTWARE",

  oddFooter:
    "&LGenerated On: &D &RPage &P of &N",

};



// ============================================================
// Workbook Properties
// ============================================================

workbook.properties = {

  title: "Sales & Financial Report",

  subject: "Garment Billing Sales Report",

  keywords:
    "Sales, Purchase, Expense, Payment",

};






res.end();



  } catch(error) {


    console.error(
      "Export Report Error:",
      error
    );


    res.status(500).json({

      success:false,

      message:
      "Failed to generate Excel report",

      error:error.message

    });


  }

};





// ============================================================
// Date Range Helper
// ============================================================


function resolveDateRange(req){


  const fromDate =
    req.query.fromDate
    ? new Date(req.query.fromDate)
    : new Date(
        new Date().setDate(
          new Date().getDate()-30
        )
      );



  const toDate =
    req.query.toDate
    ? new Date(req.query.toDate)
    : new Date();



  return {

    fromDate,

    toDate

  };


}





// ============================================================
// Date Format Helper
// ============================================================


function formatDate(date){


  if(!date)
    return "-";



  const d = new Date(date);



  return (

    String(d.getDate()).padStart(2,"0")
    +
    "-"
    +
    String(d.getMonth()+1).padStart(2,"0")
    +
    "-"
    +
    d.getFullYear()

  );


}
// ============================================================================
// 8. GET /api/reports/manager-dashboard
// Professional Manager Dashboard
// ============================================================================

exports.getManagerDashboard = async (req, res) => {
  try {

    // ============================================================
    // Today Date Range
    // ============================================================

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ============================================================
    // Dashboard Counts
    // ============================================================

    const [
      todayInvoices,
      todayCustomers,
      lowStockProducts,
      pendingInvoices,
      recentSales,
      paymentSummary,
      topProducts,
    ] = await Promise.all([

      // Today's invoices

      GarmentInvoice.find({
        invoiceDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }).populate("customer", "customerName"),

      // Today's new customers

      GarmentCustomer.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),

      // Low Stock

      GarmentProduct.countDocuments({
        $expr: {
          $lte: [
            "$stockQty",
            "$reorderLevel",
          ],
        },
      }),

      // Pending Payments

      GarmentInvoice.countDocuments({
        paymentStatus: {
          $in: [
            "pending",
            "partial",
          ],
        },
      }),

      // Recent Sales

      GarmentInvoice.find()
        .sort({
          invoiceDate: -1,
        })
        .limit(10)
        .populate(
          "customer",
          "customerName"
        ),

      // Payment Summary

      GarmentInvoice.aggregate([

        {
          $group: {
            _id: "$paymentMethod",
            totalAmount: {
              $sum: "$grandTotal",
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            totalAmount: -1,
          },
        },

      ]),

      // Top Products Today

      GarmentInvoice.aggregate([

        {
          $match: {
            invoiceDate: {
              $gte: todayStart,
              $lte: todayEnd,
            },
          },
        },

        {
          $unwind: "$items",
        },

        {
          $group: {

            _id: "$items.product",

            productName: {
              $first: "$items.productName",
            },

            quantity: {
              $sum: "$items.quantity",
            },

            sales: {
              $sum: "$items.totalAmount",
            },

          },
        },

        {
          $sort: {
            sales: -1,
          },
        },

        {
          $limit: 5,
        },

      ]),

    ]);

    // ============================================================
    // Today's Summary
    // ============================================================

    const todayRevenue = todayInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.grandTotal || 0),
      0
    );

    const totalPaid = todayInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.paidAmount || 0),
      0
    );

    const totalDue = todayInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.dueAmount || 0),
      0
    );

    // ============================================================
    // Sales Status
    // ============================================================

    const statusSummary = {
      paid: 0,
      partial: 0,
      pending: 0,
    };

    todayInvoices.forEach((invoice) => {

      if (
        statusSummary[invoice.paymentStatus] !== undefined
      ) {
        statusSummary[invoice.paymentStatus]++;
      }

    });

    // ============================================================
    // Recent Sales
    // ============================================================

    const sales = recentSales.map((invoice) => ({

      invoiceNo: invoice.invoiceNo,

      customer:
        invoice.customer?.customerName ||
        "Walk-in Customer",

      invoiceDate: invoice.invoiceDate,

      totalItems: invoice.items.length,

      quantity: invoice.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),

      amount: invoice.grandTotal,

      paidAmount: invoice.paidAmount,

      dueAmount: invoice.dueAmount,

      paymentMethod: invoice.paymentMethod,

      paymentStatus: invoice.paymentStatus,

    }));

    // ============================================================
    // Response
    // ============================================================

    res.json({

      success: true,

      dashboard: {

        todaySales: todayRevenue,

        todayOrders: todayInvoices.length,

        todayCustomers,

        lowStockProducts,

        pendingInvoices,

        totalPaid,

        totalDue,

      },

      paymentSummary,

      salesStatus: statusSummary,

      topProducts,

      recentSales: sales,

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,

      message: "Failed to load manager dashboard",

      error: err.message,

    });

  }
};