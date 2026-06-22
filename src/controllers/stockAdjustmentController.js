const StockAdjustment = require("../model/StockAdjustment");

const GarmentProduct = require("../model/GarmentProduct");

const stockCalculation = require("../utils/stockCalculator");

const createStockLedger = require("../utils/stockLedger");

/*
|--------------------------------------------------------------------------
| Create Stock Adjustment
|--------------------------------------------------------------------------
*/

exports.createStockAdjustment = async (req, res) => {
  try {
    const { product, skuCode, adjustmentType, quantity, reason } = req.body;

    const item = await GarmentProduct.findById(product);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    const variant = item.variants.find((v) => v.skuCode === skuCode);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant Not Found",
      });
    }

    const operation =
      adjustmentType === "increase" ? "adjustment_in" : "adjustment_out";

    const stock = stockCalculation(variant.currentStock, quantity, operation);

    variant.currentStock = stock.afterStock;

    await item.save();

    await createStockLedger({
      product: item._id,

      skuCode,

      movementType: operation,

      quantity,

      beforeStock: stock.beforeStock,

      afterStock: stock.afterStock,

      referenceNumber: "STOCK_ADJUSTMENT",

      remarks: reason,
    });

    const adjustment = await StockAdjustment.create({
      product,
      skuCode,
      adjustmentType,
      quantity,
      reason,
    });

    res.status(201).json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Adjustments
|--------------------------------------------------------------------------
*/

exports.getStockAdjustments = async (req, res) => {
  try {
    const adjustments = await StockAdjustment.find().populate(
      "product",
      "productName",
    );

    res.json({
      success: true,
      count: adjustments.length,
      data: adjustments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStockAdjustmentById = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);

    res.json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteStockAdjustment = async (req, res) => {
  try {
    await StockAdjustment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Stock Adjustment Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
