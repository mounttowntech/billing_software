const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// ============================================================
// MODELS
// ============================================================

const GarmentInvoice = require("../model/GarmentInvoice");
const Purchase = require("../model/Purchase");
const Expense = require("../model/Expense");
const Payment = require("../model/Payment");
const GarmentProduct = require("../model/GarmentProduct");
const GarmentCustomer = require("../model/GarmentCustomer");
const Supplier = require("../model/supplierModel");

// ============================================================
// HELPER: DATE RANGE
// ============================================================

function resolveDateRange(req) {
  const { from, to } = req.query;

  let fromDate;
  let toDate;

  // ----------------------------------------------------------
  // FROM
  // ----------------------------------------------------------

  if (from) {
    fromDate = new Date(`${from}T00:00:00.000Z`);
  } else {
    fromDate = new Date();
    fromDate.setUTCHours(0, 0, 0, 0);
    fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  }

  // ----------------------------------------------------------
  // TO
  // ----------------------------------------------------------

  if (to) {
    toDate = new Date(`${to}T23:59:59.999Z`);
  } else {
    toDate = new Date();
    toDate.setUTCHours(23, 59, 59, 999);
  }

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (isNaN(fromDate.getTime())) {
    throw new Error(`Invalid from date: ${from}`);
  }

  if (isNaN(toDate.getTime())) {
    throw new Error(`Invalid to date: ${to}`);
  }

  if (fromDate > toDate) {
    throw new Error("From date cannot be greater than To date");
  }

  return {
    fromDate,
    toDate,
  };
}

// ============================================================
// HELPER: PREVIOUS PERIOD
// ============================================================

function previousPeriod(fromDate, toDate) {
  const diff = toDate.getTime() - fromDate.getTime();

  const prevTo = new Date(fromDate.getTime() - 1);

  const prevFrom = new Date(prevTo.getTime() - diff);

  return {
    prevFrom,
    prevTo,
  };
}

// ============================================================
// HELPER: PERCENTAGE CHANGE
// ============================================================

function pctChange(current, previous) {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return Number(
    (((current - previous) / previous) * 100).toFixed(2)
  );
}

// ============================================================
// HELPER: FORMAT CURRENCY
// ============================================================

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================================
// HELPER: FORMAT DATE
// ============================================================

function formatDate(date) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "-";
  }

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

// ============================================================
// HELPER: SUM IN RANGE
// ============================================================

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

// ============================================================
// LEDGER PIPELINE
// ============================================================

function buildLedgerPipeline(fromDate, toDate) {
  return [
    // ========================================================
    // EXPENSE
    // ========================================================

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

        referenceNo: "$expenseNo",

        date: "$createdAt",

        party: "$category",

        netAmount: {
          $multiply: ["$amount", -1],
        },
      },
    },

    // ========================================================
    // SALES
    // ========================================================

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
              _id: 0,

              type: {
                $literal: "Sale",
              },

              referenceNo: "$invoiceNo",

              date: "$invoiceDate",

              party: "$customerName",

              netAmount: "$grandTotal",
            },
          },
        ],
      },
    },

    // ========================================================
    // PURCHASE
    // ========================================================

    {
      $unionWith: {
        coll: "purchases",

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
              _id: 0,

              type: {
                $literal: "Purchase",
              },

              referenceNo: "$purchaseNo",

              date: "$purchaseDate",

              party: "$supplierName",

              netAmount: {
                $multiply: ["$grandTotal", -1],
              },
            },
          },
        ],
      },
    },

    // ========================================================
    // PAYMENTS
    // ========================================================

    {
      $unionWith: {
        coll: "payments",

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
              _id: 0,

              type: {
                $literal: "Payment",
              },

              referenceNo: "$paymentNo",

              date: "$paymentDate",

              party: "$partyName",

              netAmount: "$amount",
            },
          },
        ],
      },
    },

    // ========================================================
    // SORT
    // ========================================================

    {
      $sort: {
        date: 1,
      },
    },
  ];
}

// ============================================================
// 1. REPORT SUMMARY
// ============================================================

exports.getReportsSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = resolveDateRange(req);

    const { prevFrom, prevTo } = previousPeriod(
      fromDate,
      toDate
    );

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

      GarmentProduct.countDocuments({
        $expr: {
          $lte: ["$stockQty", "$reorderLevel"],
        },
      }),

      GarmentInvoice.find({
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
        .populate("customer", "customerName")
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
        formatted: formatCurrency(totalPurchases),
        change: pctChange(
          totalPurchases,
          previousPurchases
        ),
      },

      totalExpenses: {
        value: totalExpenses,
        formatted: formatCurrency(totalExpenses),
        change: pctChange(
          totalExpenses,
          previousExpenses
        ),
      },

      netProfit: {
        value: netProfit,
        formatted: formatCurrency(netProfit),
        change: pctChange(
          netProfit,
          previousNetProfit
        ),
      },

      lowStockItems,

      recentSales: recentSales.map((invoice) => ({
        invoiceNo: invoice.invoiceNo,

        customer:
          invoice.customer?.customerName ||
          "Walk-in",

        date: invoice.invoiceDate,

        total: invoice.grandTotal,

        paid: invoice.paidAmount,

        due: invoice.dueAmount,

        paymentMethod:
          invoice.paymentMethod,

        paymentStatus:
          invoice.paymentStatus,
      })),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary",
      error: err.message,
    });
  }
};

// ============================================================
// 2. REPORT ANALYTICS
// ============================================================

exports.getReportsAnalytics = async (req, res) => {
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
          $lte: ["$stockQty", "$reorderLevel"],
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
      totalInventoryValue[0]?.total || 0;

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
            formatCurrency(customerDue),

          supplierDue:
            formatCurrency(supplierDue),

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
      message: "Failed to load dashboard analytics",
      error: err.message,
    });
  }
};

// ============================================================
// 3. SALES TREND
// ============================================================

exports.getSalesTrend = async (req, res) => {
  try {
    const { fromDate, toDate } =
      resolveDateRange(req);

    const period =
      req.query.period || "daily";

    const { prevFrom, prevTo } =
      previousPeriod(
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

    const buildTrend = async (
      start,
      end
    ) => {
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
                $size: {
                  $ifNull: ["$items", []],
                },
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
        buildTrend(
          fromDate,
          toDate
        ),

        buildTrend(
          prevFrom,
          prevTo
        ),
      ]);

    const totalSales =
      current.reduce(
        (sum, row) =>
          sum +
          Number(row.totalSales || 0),
        0
      );

    const totalInvoices =
      current.reduce(
        (sum, row) =>
          sum +
          Number(row.totalInvoices || 0),
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
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to load sales trend",
      error: err.message,
    });
  }
};

// ============================================================
// 4. SALES BY CATEGORY / PRODUCT
// ============================================================

exports.getSalesByCategory = async (req, res) => {
  try {
    const { fromDate, toDate } =
      resolveDateRange(req);

    const categories =
      await GarmentInvoice.aggregate([
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
              $first:
                "$items.productName",
            },

            skuCode: {
              $first:
                "$items.skuCode",
            },

            barcode: {
              $first:
                "$items.barcode",
            },

            quantitySold: {
              $sum:
                "$items.quantity",
            },

            totalSales: {
              $sum:
                "$items.totalAmount",
            },

            totalGST: {
              $sum:
                "$items.gstAmount",
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

    const totalSales =
      categories.reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalSales || 0
          ),
        0
      );

    const totalQuantity =
      categories.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantitySold || 0
          ),
        0
      );

    const totalGST =
      categories.reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalGST || 0
          ),
        0
      );

    const result =
      categories.map((item) => ({
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
            Number(
              item.averagePrice || 0
            ).toFixed(2)
          ),
      }));

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
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to load sales by category",
      error: err.message,
    });
  }
};

// ============================================================
// 5. SALES SUMMARY / LEDGER
// ============================================================

exports.getSalesSummary = async (req, res) => {
  try {
    const { fromDate, toDate } =
      resolveDateRange(req);

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 20;

    const skip =
      (page - 1) * limit;

    const pipeline =
      buildLedgerPipeline(
        fromDate,
        toDate
      );

    pipeline.push({
      $facet: {
        data: [
          {
            $skip: skip,
          },

          {
            $limit: limit,
          },
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
                      $lt: [
                        "$netAmount",
                        0,
                      ],
                    },

                    {
                      $abs:
                        "$netAmount",
                    },

                    0,
                  ],
                },
              },

              totalCredit: {
                $sum: {
                  $cond: [
                    {
                      $gt: [
                        "$netAmount",
                        0,
                      ],
                    },

                    "$netAmount",

                    0,
                  ],
                },
              },

              netAmount: {
                $sum:
                  "$netAmount",
              },
            },
          },
        ],
      },
    });

    const result =
      await Expense.aggregate(
        pipeline
      );

    const rows =
      result[0]?.data || [];

    const totals =
      result[0]?.totals?.[0] || {
        totalRecords: 0,
        totalDebit: 0,
        totalCredit: 0,
        netAmount: 0,
      };

    const formattedRows =
      rows.map((row, index) => {
        const amount =
          Number(
            row.netAmount || 0
          );

        return {
          sno:
            skip + index + 1,

          type:
            row.type,

          referenceNo:
            row.referenceNo || "-",

          date:
            row.date,

          party:
            row.party || "-",

          debit:
            amount < 0
              ? Math.abs(amount)
              : 0,

          credit:
            amount > 0
              ? amount
              : 0,

          netAmount:
            amount,
        };
      });

    res.json({
      success: true,

      page,

      limit,

      totalPages:
        Math.ceil(
          totals.totalRecords /
            limit
        ),

      totalRecords:
        totals.totalRecords,

      summary: {
        totalDebit:
          totals.totalDebit,

        totalCredit:
          totals.totalCredit,

        netAmount:
          totals.netAmount,
      },

      rows:
        formattedRows,
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

// ============================================================
// 6. TOP SELLING PRODUCTS
// ============================================================

exports.getTopSellingProducts =
  async (req, res) => {
    try {
      const {
        fromDate,
        toDate,
      } = resolveDateRange(req);

      const limit =
        Number(req.query.limit) || 10;

      const products =
        await GarmentInvoice.aggregate([
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
              _id:
                "$items.product",

              productName: {
                $first:
                  "$items.productName",
              },

              skuCode: {
                $first:
                  "$items.skuCode",
              },

              barcode: {
                $first:
                  "$items.barcode",
              },

              quantitySold: {
                $sum:
                  "$items.quantity",
              },

              totalSales: {
                $sum:
                  "$items.totalAmount",
              },

              invoiceCount: {
                $sum: 1,
              },

              gstCollected: {
                $sum:
                  "$items.gstAmount",
              },

              averageSellingPrice: {
                $avg:
                  "$items.price",
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
              from:
                "garmentproducts",

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
                  {
                    $ifNull: [
                      "$averageSellingPrice",
                      0,
                    ],
                  },
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

      const totalSales =
        products.reduce(
          (sum, item) =>
            sum +
            Number(
              item.totalSales || 0
            ),
          0
        );

      const totalQuantitySold =
        products.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantitySold || 0
            ),
          0
        );

      const totalGSTCollected =
        products.reduce(
          (sum, item) =>
            sum +
            Number(
              item.gstCollected || 0
            ),
          0
        );

      const finalProducts =
        products.map(
          (item, index) => ({
            rank: index + 1,

            ...item,

            salesContribution:
              totalSales === 0
                ? 0
                : Number(
                    (
                      (item.totalSales /
                        totalSales) *
                      100
                    ).toFixed(2)
                  ),

            stockStatus:
              item.currentStock <=
              item.reorderLevel
                ? "Low Stock"
                : "Available",
          })
        );

      res.json({
        success: true,

        reportRange: {
          from: fromDate,
          to: toDate,
        },

        summary: {
          totalProducts:
            finalProducts.length,

          totalQuantitySold,

          totalSales,

          totalGSTCollected,
        },

        products:
          finalProducts,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Failed to load top selling products",
        error: err.message,
      });
    }
  };

// ============================================================
// 7. EXPORT PDF REPORT
// ============================================================

exports.exportPDFReport =
  async (req, res) => {
    try {
      // ======================================================
      // DATE RANGE
      // ======================================================

      const {
        fromDate,
        toDate,
      } = resolveDateRange(req);

      console.log(
        "===================================="
      );

      console.log(
        "PDF REPORT REQUEST"
      );

      console.log(
        "Query:",
        req.query
      );

      console.log(
        "From:",
        fromDate.toISOString()
      );

      console.log(
        "To:",
        toDate.toISOString()
      );

      // ======================================================
      // GET LEDGER DATA
      // ======================================================

      const pipeline =
        buildLedgerPipeline(
          fromDate,
          toDate
        );

      const rows =
        await Expense.aggregate(
          pipeline
        );

      console.log(
        "Ledger rows:",
        rows.length
      );

      // ======================================================
      // SUMMARY
      // ======================================================

      let totalSales = 0;
      let totalPurchases = 0;
      let totalExpenses = 0;
      let totalPayments = 0;

      rows.forEach((row) => {
        const amount =
          Number(
            row.netAmount || 0
          );

        switch (row.type) {
          case "Sale":
            totalSales +=
              Math.abs(amount);
            break;

          case "Purchase":
            totalPurchases +=
              Math.abs(amount);
            break;

          case "Expense":
            totalExpenses +=
              Math.abs(amount);
            break;

          case "Payment":
            totalPayments +=
              Math.abs(amount);
            break;

          default:
            break;
        }
      });

      const netProfit =
        totalSales -
        totalPurchases -
        totalExpenses;

      // ======================================================
      // PDF DOCUMENT
      // ======================================================

      const doc =
        new PDFDocument({
          size: "A4",
          layout: "landscape",

          margins: {
            top: 40,
            bottom: 45,
            left: 30,
            right: 30,
          },

          bufferPages: true,
        });

      const fileName =
        `Sales_Report_${Date.now()}.pdf`;

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      doc.pipe(res);

      // ======================================================
      // PAGE DIMENSIONS
      // ======================================================

      const pageWidth =
        doc.page.width;

      const pageHeight =
        doc.page.height;

      const left = 30;

      const right = 30;

      const contentWidth =
        pageWidth -
        left -
        right;

      // ======================================================
      // COMPANY HEADER
      // ======================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(
          "GARMENT BILLING SOFTWARE",
          {
            align: "center",
            width: contentWidth,
          }
        );

      doc.moveDown(0.2);

      doc
        .font("Helvetica")
        .fontSize(14)
        .text(
          "Sales & Financial Report",
          {
            align: "center",
            width: contentWidth,
          }
        );

      doc.moveDown(0.8);

      // ======================================================
      // REPORT INFO
      // ======================================================

      const infoY = doc.y;

      doc
        .font("Helvetica")
        .fontSize(9);

      doc.text(
        `Report From : ${formatDate(
          fromDate
        )}`,
        left,
        infoY,
        {
          width: 240,
          align: "left",
        }
      );

      doc.text(
        `Report To : ${formatDate(
          toDate
        )}`,
        left + 270,
        infoY,
        {
          width: 200,
          align: "left",
        }
      );

      doc.text(
        `Generated On : ${formatDate(
          new Date()
        )}`,
        left + 520,
        infoY,
        {
          width: 230,
          align: "left",
        }
      );

      doc.y = infoY + 25;

      // ======================================================
      // LINE
      // ======================================================

      doc
        .moveTo(
          left,
          doc.y
        )
        .lineTo(
          pageWidth - right,
          doc.y
        )
        .stroke();

      doc.moveDown(0.8);

      // ======================================================
      // SUMMARY
      // ======================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("SUMMARY");

      doc.moveDown(0.4);

      const summaryHeaders = [
        "Total Sales",
        "Total Purchases",
        "Total Expenses",
        "Total Payments",
        "Net Profit",
      ];

      const summaryValues = [
        formatCurrency(totalSales),
        formatCurrency(totalPurchases),
        formatCurrency(totalExpenses),
        formatCurrency(totalPayments),
        formatCurrency(netProfit),
      ];

      const summaryWidth =
        contentWidth / 5;

      const summaryHeaderHeight = 24;

      const summaryValueHeight = 28;

      let x = left;

      // ======================================================
      // SUMMARY HEADER
      // ======================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(8);

      const summaryHeaderY =
        doc.y;

      summaryHeaders.forEach(
        (header) => {
          doc
            .rect(
              x,
              summaryHeaderY,
              summaryWidth,
              summaryHeaderHeight
            )
            .stroke();

          doc.text(
            header,
            x + 4,
            summaryHeaderY + 7,
            {
              width:
                summaryWidth - 8,

              align: "center",

              lineBreak: false,
            }
          );

          x += summaryWidth;
        }
      );

      // ======================================================
      // SUMMARY VALUES
      // ======================================================

      const summaryValueY =
        summaryHeaderY +
        summaryHeaderHeight;

      x = left;

      doc
        .font("Helvetica")
        .fontSize(8);

      summaryValues.forEach(
        (value) => {
          doc
            .rect(
              x,
              summaryValueY,
              summaryWidth,
              summaryValueHeight
            )
            .stroke();

          doc.text(
            value,
            x + 5,
            summaryValueY + 8,
            {
              width:
                summaryWidth - 10,

              align: "right",

              lineBreak: false,
            }
          );

          x += summaryWidth;
        }
      );

      doc.y =
        summaryValueY +
        summaryValueHeight +
        25;

      // ======================================================
      // LEDGER TITLE
      // ======================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("LEDGER");

      doc.moveDown(0.4);

      // ======================================================
      // LEDGER COLUMN WIDTHS
      // ======================================================
      //
      // Total:
      //
      // 75 + 120 + 85 + 220 + 90 + 90 + 102
      // = 782
      //
      // A4 landscape:
      //
      // 842 - 30 - 30 = 782
      //
      // ======================================================

      const columnWidths = [
        75,  // Type
        120, // Reference No
        85,  // Date
        220, // Party
        90,  // Debit
        90,  // Credit
        102, // Net Amount
      ];

      const headerHeight = 25;

      const rowHeight = 22;

      // ======================================================
      // DRAW LEDGER HEADER
      // ======================================================

      const drawLedgerHeader = () => {
        const headerY =
          doc.y;

        let headerX =
          left;

        const headers = [
          "Type",
          "Reference No",
          "Date",
          "Party",
          "Debit",
          "Credit",
          "Net Amount",
        ];

        doc
          .font("Helvetica-Bold")
          .fontSize(7.5);

        headers.forEach(
          (header, index) => {
            const width =
              columnWidths[index];

            doc
              .rect(
                headerX,
                headerY,
                width,
                headerHeight
              )
              .stroke();

            doc.text(
              header,
              headerX + 4,
              headerY + 8,
              {
                width:
                  width - 8,

                align:
                  index >= 4
                    ? "right"
                    : "left",

                lineBreak: false,
              }
            );

            headerX += width;
          }
        );

        doc.y =
          headerY +
          headerHeight;
      };

      // ======================================================
      // FIRST HEADER
      // ======================================================

      drawLedgerHeader();

      // ======================================================
      // NO DATA
      // ======================================================

      if (
        !rows ||
        rows.length === 0
      ) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(
            "No records found for the selected date range.",
            left,
            doc.y + 10,
            {
              width: contentWidth,
              align: "center",
            }
          );
      }

      // ======================================================
      // LEDGER TOTALS
      // ======================================================

      let totalDebit = 0;

      let totalCredit = 0;

      // ======================================================
      // LEDGER ROWS
      // ======================================================

      for (
        let i = 0;
        i < rows.length;
        i++
      ) {
        const row =
          rows[i];

        const amount =
          Number(
            row.netAmount || 0
          );

        let debit = 0;

        let credit = 0;

        // ----------------------------------------------------
        // DEBIT
        // ----------------------------------------------------

        if (
          row.type === "Purchase" ||
          row.type === "Expense"
        ) {
          debit =
            Math.abs(amount);

          totalDebit += debit;
        }

        // ----------------------------------------------------
        // CREDIT
        // ----------------------------------------------------

        if (
          row.type === "Sale" ||
          row.type === "Payment"
        ) {
          credit =
            Math.abs(amount);

          totalCredit += credit;
        }

        // ====================================================
        // PAGE SPACE CHECK
        // ====================================================

        if (
          doc.y +
            rowHeight >
          pageHeight - 55
        ) {
          doc.addPage();

          doc.y = 40;

          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(
              "LEDGER - CONTINUED",
              left,
              doc.y,
              {
                width: contentWidth,
                align: "left",
              }
            );

          doc.moveDown(0.4);

          drawLedgerHeader();
        }

        // ====================================================
        // ROW
        // ====================================================

        const rowY =
          doc.y;

        let rowX =
          left;

        const values = [
          row.type || "-",

          row.referenceNo || "-",

          formatDate(row.date),

          row.party || "-",

          formatCurrency(debit),

          formatCurrency(credit),

          formatCurrency(amount),
        ];

        doc
          .font("Helvetica")
          .fontSize(7);

        values.forEach(
          (value, index) => {
            const width =
              columnWidths[index];

            doc
              .rect(
                rowX,
                rowY,
                width,
                rowHeight
              )
              .stroke();

            const isNumeric =
              index >= 4;

            doc.text(
              String(value),
              rowX + 4,
              rowY + 7,
              {
                width:
                  width - 8,

                height:
                  rowHeight - 6,

                align:
                  isNumeric
                    ? "right"
                    : "left",

                lineBreak: false,

                ellipsis: true,
              }
            );

            rowX += width;
          }
        );

        doc.y =
          rowY +
          rowHeight;
      }

      // ======================================================
      // GRAND TOTAL PAGE CHECK
      // ======================================================

      if (
        doc.y + 75 >
        pageHeight - 45
      ) {
        doc.addPage();

        doc.y = 40;
      }

      doc.moveDown(1);

      // ======================================================
      // GRAND TOTAL TITLE
      // ======================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          "GRAND TOTAL",
          left,
          doc.y,
          {
            width: contentWidth,
            align: "left",
          }
        );

      doc.moveDown(0.4);

      // ======================================================
      // GRAND TOTAL WIDTHS
      // ======================================================

      const grandWidths = [
        402,
        120,
        120,
        140,
      ];

      // Total = 782

      const grandHeaders = [
        "",
        "Debit",
        "Credit",
        "Net Amount",
      ];

      const grandValues = [
        "GRAND TOTAL",
        formatCurrency(totalDebit),
        formatCurrency(totalCredit),
        formatCurrency(netProfit),
      ];

      const grandY =
        doc.y;

      // ======================================================
      // GRAND TOTAL HEADER
      // ======================================================

      let grandX =
        left;

      doc
        .font("Helvetica-Bold")
        .fontSize(8);

      grandHeaders.forEach(
        (header, index) => {
          const width =
            grandWidths[index];

          doc
            .rect(
              grandX,
              grandY,
              width,
              25
            )
            .stroke();

          doc.text(
            header,
            grandX + 5,
            grandY + 8,
            {
              width:
                width - 10,

              align:
                index === 0
                  ? "left"
                  : "right",

              lineBreak: false,
            }
          );

          grandX += width;
        }
      );

      // ======================================================
      // GRAND TOTAL VALUES
      // ======================================================

      grandX =
        left;

      grandValues.forEach(
        (value, index) => {
          const width =
            grandWidths[index];

          doc
            .rect(
              grandX,
              grandY + 25,
              width,
              25
            )
            .stroke();

          doc.text(
            String(value),
            grandX + 5,
            grandY + 33,
            {
              width:
                width - 10,

              align:
                index === 0
                  ? "left"
                  : "right",

              lineBreak: false,
            }
          );

          grandX += width;
        }
      );

      // ======================================================
      // PAGE NUMBERS
      // ======================================================

      const pageRange =
        doc.bufferedPageRange();

      for (
        let i =
          pageRange.start;

        i <
        pageRange.start +
          pageRange.count;

        i++
      ) {
        doc.switchToPage(i);

        const pageNumber =
          i -
          pageRange.start +
          1;

        doc
          .font("Helvetica")
          .fontSize(7)
          .text(
            `Generated by Garment Billing Software | Page ${pageNumber} of ${pageRange.count}`,
            left,
            pageHeight - 25,
            {
              width:
                contentWidth,

              align: "center",

              lineBreak: false,
            }
          );
      }

      // ======================================================
      // END PDF
      // ======================================================

      doc.end();
    } catch (error) {
      console.error(
        "Export PDF Report Error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,

          message:
            "Failed to generate PDF report",

          error:
            error.message,
        });
      }
    }
  };

// ============================================================
// 8. EXPORT EXCEL REPORT
// ============================================================

exports.exportReport =
  async (req, res) => {
    try {
      const {
        fromDate,
        toDate,
      } = resolveDateRange(req);

      // ======================================================
      // GET LEDGER DATA
      // ======================================================

      const pipeline =
        buildLedgerPipeline(
          fromDate,
          toDate
        );

      const rows =
        await Expense.aggregate(
          pipeline
        );

      // ======================================================
      // SUMMARY
      // ======================================================

      let totalSales = 0;

      let totalPurchases = 0;

      let totalExpenses = 0;

      let totalPayments = 0;

      rows.forEach((row) => {
        const amount =
          Number(
            row.netAmount || 0
          );

        switch (row.type) {
          case "Sale":
            totalSales +=
              Math.abs(amount);
            break;

          case "Purchase":
            totalPurchases +=
              Math.abs(amount);
            break;

          case "Expense":
            totalExpenses +=
              Math.abs(amount);
            break;

          case "Payment":
            totalPayments +=
              Math.abs(amount);
            break;

          default:
            break;
        }
      });

      const netProfit =
        totalSales -
        totalPurchases -
        totalExpenses;

      // ======================================================
      // WORKBOOK
      // ======================================================

      const workbook =
        new ExcelJS.Workbook();

      workbook.creator =
        "Garment Billing Software";

      workbook.created =
        new Date();

      const sheet =
        workbook.addWorksheet(
          "Sales Report"
        );

      // ======================================================
      // TITLE
      // ======================================================

      sheet.mergeCells("A1:G1");

      const titleCell =
        sheet.getCell("A1");

      titleCell.value =
        "GARMENT BILLING SOFTWARE";

      titleCell.font = {
        size: 20,
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",

        fgColor: {
          argb: "1F4E78",
        },
      };

      sheet.getRow(1).height =
        30;

      // ======================================================
      // SUBTITLE
      // ======================================================

      sheet.mergeCells("A2:G2");

      const subtitleCell =
        sheet.getCell("A2");

      subtitleCell.value =
        "Sales & Financial Report";

      subtitleCell.font = {
        size: 14,
        bold: true,
      };

      subtitleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(2).height =
        24;

      // ======================================================
      // REPORT INFORMATION
      // ======================================================

      sheet.getCell("A4").value =
        "Report From";

      sheet.getCell("B4").value =
        formatDate(fromDate);

      sheet.getCell("D4").value =
        "Report To";

      sheet.getCell("E4").value =
        formatDate(toDate);

      sheet.getCell("A5").value =
        "Generated On";

      sheet.getCell("B5").value =
        formatDate(new Date());

      ["A4", "D4", "A5"].forEach(
        (cell) => {
          sheet.getCell(
            cell
          ).font = {
            bold: true,
          };
        }
      );

      ["A4", "B4", "D4", "E4", "A5", "B5"].forEach(
        (cell) => {
          sheet.getCell(
            cell
          ).alignment = {
            vertical: "middle",
            horizontal:
              cell.startsWith("A") ||
              cell.startsWith("D")
                ? "left"
                : "left",
          };
        }
      );

      // ======================================================
      // SUMMARY
      // ======================================================

      sheet.mergeCells("A7:G7");

      const summaryTitle =
        sheet.getCell("A7");

      summaryTitle.value =
        "SUMMARY";

      summaryTitle.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      summaryTitle.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      summaryTitle.fill = {
        type: "pattern",
        pattern: "solid",

        fgColor: {
          argb: "2F75B5",
        },
      };

      const summaryData = [
        [
          "Total Sales",
          totalSales,
        ],

        [
          "Total Purchases",
          totalPurchases,
        ],

        [
          "Total Expenses",
          totalExpenses,
        ],

        [
          "Total Payments",
          totalPayments,
        ],

        [
          "Net Profit",
          netProfit,
        ],
      ];

      summaryData.forEach(
        (item, index) => {
          const rowNumber =
            8 + index;

          const labelCell =
            sheet.getCell(
              `A${rowNumber}`
            );

          const valueCell =
            sheet.getCell(
              `B${rowNumber}`
            );

          labelCell.value =
            item[0];

          valueCell.value =
            item[1];

          labelCell.font = {
            bold: true,
          };

          labelCell.alignment = {
            horizontal: "left",
            vertical: "middle",
          };

          valueCell.alignment = {
            horizontal: "right",
            vertical: "middle",
          };

          valueCell.numFmt =
            "#,##0.00";
        }
      );

      // ======================================================
      // LEDGER HEADER
      // ======================================================

      const headerRow = 14;

      const ledgerHeader =
        sheet.getRow(
          headerRow
        );

      ledgerHeader.values = [
        "Type",
        "Reference No",
        "Date",
        "Party",
        "Debit",
        "Credit",
        "Net Amount",
      ];

      ledgerHeader.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      ledgerHeader.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      ledgerHeader.fill = {
        type: "pattern",
        pattern: "solid",

        fgColor: {
          argb: "4472C4",
        },
      };

      ledgerHeader.height =
        24;

      // ======================================================
      // LEDGER ROWS
      // ======================================================

      let totalDebit = 0;

      let totalCredit = 0;

      rows.forEach((row) => {
        const amount =
          Number(
            row.netAmount || 0
          );

        let debit = 0;

        let credit = 0;

        if (
          row.type === "Purchase" ||
          row.type === "Expense"
        ) {
          debit =
            Math.abs(amount);

          totalDebit += debit;
        }

        if (
          row.type === "Sale" ||
          row.type === "Payment"
        ) {
          credit =
            Math.abs(amount);

          totalCredit += credit;
        }

        const excelRow =
          sheet.addRow([
            row.type || "-",

            row.referenceNo || "-",

            formatDate(row.date),

            row.party || "-",

            debit,

            credit,

            amount,
          ]);

        // ----------------------------------------------------
        // TEXT ALIGNMENT
        // ----------------------------------------------------

        excelRow.getCell(1).alignment = {
          horizontal: "left",
          vertical: "middle",
        };

        excelRow.getCell(2).alignment = {
          horizontal: "left",
          vertical: "middle",
        };

        excelRow.getCell(3).alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        excelRow.getCell(4).alignment = {
          horizontal: "left",
          vertical: "middle",
        };

        // ----------------------------------------------------
        // NUMBER ALIGNMENT
        // ----------------------------------------------------

        excelRow.getCell(5).alignment = {
          horizontal: "right",
          vertical: "middle",
        };

        excelRow.getCell(6).alignment = {
          horizontal: "right",
          vertical: "middle",
        };

        excelRow.getCell(7).alignment = {
          horizontal: "right",
          vertical: "middle",
        };

        // ----------------------------------------------------
        // NUMBER FORMAT
        // ----------------------------------------------------

        excelRow.getCell(5).numFmt =
          "#,##0.00";

        excelRow.getCell(6).numFmt =
          "#,##0.00";

        excelRow.getCell(7).numFmt =
          "#,##0.00";

        // ----------------------------------------------------
        // BORDERS
        // ----------------------------------------------------

        excelRow.eachCell(
          (cell) => {
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

            cell.alignment = {
              ...cell.alignment,

              vertical: "middle",
            };
          }
        );

        excelRow.height =
          20;
      });

      // ======================================================
      // GRAND TOTAL
      // ======================================================

      const totalRow =
        sheet.addRow([
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

      totalRow.fill = {
        type: "pattern",
        pattern: "solid",

        fgColor: {
          argb: "1F4E78",
        },
      };

      totalRow.alignment = {
        vertical: "middle",
      };

      totalRow.getCell(4).alignment = {
        horizontal: "left",
        vertical: "middle",
      };

      totalRow.getCell(5).alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      totalRow.getCell(6).alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      totalRow.getCell(7).alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      totalRow.getCell(5).numFmt =
        "#,##0.00";

      totalRow.getCell(6).numFmt =
        "#,##0.00";

      totalRow.getCell(7).numFmt =
        "#,##0.00";

      totalRow.eachCell(
        (cell) => {
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
        }
      );

      // ======================================================
      // COLUMN WIDTH
      // ======================================================

      sheet.columns = [
        {
          key: "type",
          width: 18,
        },

        {
          key: "referenceNo",
          width: 22,
        },

        {
          key: "date",
          width: 18,
        },

        {
          key: "party",
          width: 35,
        },

        {
          key: "debit",
          width: 18,
        },

        {
          key: "credit",
          width: 18,
        },

        {
          key: "netAmount",
          width: 20,
        },
      ];

      // ======================================================
      // ALIGN ALL DATA COLUMNS
      // ======================================================

      sheet.eachRow(
        (row, rowNumber) => {
          if (rowNumber >= 14) {
            row.getCell(1).alignment = {
              horizontal: "left",
              vertical: "middle",
            };

            row.getCell(2).alignment = {
              horizontal: "left",
              vertical: "middle",
            };

            row.getCell(3).alignment = {
              horizontal: "center",
              vertical: "middle",
            };

            row.getCell(4).alignment = {
              horizontal: "left",
              vertical: "middle",
            };

            row.getCell(5).alignment = {
              horizontal: "right",
              vertical: "middle",
            };

            row.getCell(6).alignment = {
              horizontal: "right",
              vertical: "middle",
            };

            row.getCell(7).alignment = {
              horizontal: "right",
              vertical: "middle",
            };
          }
        }
      );

      // ======================================================
      // FILTER
      // ======================================================

      sheet.autoFilter = {
        from: "A14",
        to: "G14",
      };

      // ======================================================
      // FREEZE
      // ======================================================

      sheet.views = [
        {
          state: "frozen",
          ySplit: 14,
          activeCell: "A15",
        },
      ];

      // ======================================================
      // PAGE SETUP
      // ======================================================

      sheet.pageSetup = {
        paperSize: 9,

        orientation:
          "landscape",

        fitToPage: true,

        fitToWidth: 1,

        fitToHeight: 0,

        horizontalDpi: 300,

        verticalDpi: 300,

        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      };

      // ======================================================
      // PRINT TITLES
      // ======================================================

      sheet.pageSetup.printTitlesRow =
        "14:14";

      // ======================================================
      // HEADER / FOOTER
      // ======================================================

      sheet.headerFooter = {
        oddHeader:
          '&C&"Arial,Bold"GARMENT BILLING SOFTWARE',

        oddFooter:
          "&LGenerated On: &D &RPage &P of &N",
      };

      // ======================================================
      // PRINT AREA
      // ======================================================

      sheet.printArea =
        `A1:G${sheet.lastRow.number}`;

      // ======================================================
      // RESPONSE
      // ======================================================

      const fileName =
        `Sales_Report_${Date.now()}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      await workbook.xlsx.write(
        res
      );

      res.end();
    } catch (error) {
      console.error(
        "Export Excel Report Error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,

          message:
            "Failed to generate Excel report",

          error:
            error.message,
        });
      }
    }
  };