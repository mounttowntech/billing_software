const SalesReturn = require("../model/SalesReturn");

const GarmentProduct = require("../model/GarmentProduct");

const stockCalculation = require("../utils/stockCalculator");

const createStockLedger = require("../utils/stockLedger");

// Create Sales Return

exports.createSalesReturn = async (req, res) => {
  try {
    const { product, skuCode, quantity, refundAmount, reason } = req.body;

    const item = await GarmentProduct.findById(product);

    const variant = item.variants.find((v) => v.skuCode === skuCode);

    const stock = stockCalculation(
      variant.currentStock,
      quantity,
      "sales_return",
    );

    variant.currentStock = stock.afterStock;

    await item.save();

    await createStockLedger({
      product: item._id,

      skuCode,

      movementType: "sales_return",

      quantity,

      beforeStock: stock.beforeStock,

      afterStock: stock.afterStock,

      referenceNumber: "SALES_RETURN",

      remarks: "Sales Return",
    });

    const salesReturn = await SalesReturn.create({
      product,
      skuCode,
      quantity,
      refundAmount,
      reason,
    });

    res.status(201).json({
      success: true,
      data: salesReturn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSalesReturns = async (req, res) => {
  try {
    const returns = await SalesReturn.find();

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSalesReturnById = async (req, res) => {
  try {
    const data = await SalesReturn.findById(req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteSalesReturn = async (req, res) => {
  try {
    await SalesReturn.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
