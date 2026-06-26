const StockAdjustment = require("../model/StockAdjustment");

const GarmentProduct = require("../model/GarmentProduct");

const stockCalculation = require("../utils/stockCalculator");

const StockLedger =
require("../model/StockLedger");
const mongoose = require("mongoose");



exports.createStockAdjustment = async (req, res) => {
  try {

    const {
      product,
      skuCode,
      adjustmentType,
      quantity,
      reason
    } = req.body;

    // Validate required fields
    if (!product || !skuCode || !adjustmentType || !quantity) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory."
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ObjectId."
      });
    }

    // Find Product
    const garmentProduct = await GarmentProduct.findById(product);

    if (!garmentProduct) {
      return res.status(404).json({
        success: false,
        message: "Garment Product not found."
      });
    }

    // Find Variant
    const variant = garmentProduct.variants.find(
      (v) => v.skuCode === skuCode
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "SKU Code not found."
      });
    }

    const operation =
      adjustmentType === "increase"
        ? "adjustment_in"
        : "adjustment_out";

    const stock = stockCalculation(
      variant.currentStock,
      Number(quantity),
      operation
    );

    variant.currentStock = stock.afterStock;

    garmentProduct.totalStock =
      garmentProduct.variants.reduce(
        (sum, item) => sum + item.currentStock,
        0
      );

    await garmentProduct.save();

    const count = await StockAdjustment.countDocuments();

    const adjustmentNo =
      `ADJ${String(count + 1).padStart(5, "0")}`;

    const adjustment = await StockAdjustment.create({
      adjustmentNo,
      product,
      skuCode,
      adjustmentType,
      quantity,
      reason
    });

    await StockLedger.create({
      product,
      skuCode,
      movementType: operation,
      quantity,
      beforeStock: stock.beforeStock,
      afterStock: stock.afterStock,
      referenceNumber: adjustmentNo,
      remarks: reason
    });

    res.status(201).json({
      success: true,
      message: "Stock Adjustment Successful",
      data: adjustment
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

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
