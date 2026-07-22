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

exports.updateSalesReturnById = async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.id);

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: "Sales Return not found.",
      });
    }

    const { product, skuCode, quantity, refundAmount, reason } = req.body;

    // Reverse old stock
    const oldProduct = await GarmentProduct.findById(salesReturn.product);

    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: "Old product not found.",
      });
    }

    const oldVariant = oldProduct.variants.find(
      (v) => v.skuCode === salesReturn.skuCode,
    );

    if (!oldVariant) {
      return res.status(404).json({
        success: false,
        message: "Old SKU not found.",
      });
    }

    // Remove previous sales return quantity
    oldVariant.currentStock -= salesReturn.quantity;
    await oldProduct.save();

    // Apply new stock
    const newProduct = await GarmentProduct.findById(
      product || salesReturn.product,
    );

    if (!newProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const newVariant = newProduct.variants.find(
      (v) => v.skuCode === (skuCode || salesReturn.skuCode),
    );

    if (!newVariant) {
      return res.status(404).json({
        success: false,
        message: "SKU not found.",
      });
    }

    const beforeStock = newVariant.currentStock;

    const updatedQuantity =
      quantity !== undefined ? quantity : salesReturn.quantity;

    newVariant.currentStock += updatedQuantity;

    const afterStock = newVariant.currentStock;

    await newProduct.save();

    // Create stock ledger entry
    await createStockLedger({
      product: newProduct._id,
      skuCode: skuCode || salesReturn.skuCode,
      movementType: "sales_return",
      quantity: updatedQuantity,
      beforeStock,
      afterStock,
      referenceNumber: "SALES_RETURN_UPDATE",
      remarks: "Sales Return Updated",
    });

    // Update sales return document
    const updatedSalesReturn = await SalesReturn.findByIdAndUpdate(
      req.params.id,
      {
        product: product || salesReturn.product,
        skuCode: skuCode || salesReturn.skuCode,
        quantity: updatedQuantity,
        refundAmount:
          refundAmount !== undefined ? refundAmount : salesReturn.refundAmount,
        reason: reason || salesReturn.reason,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Sales Return updated successfully.",
      data: updatedSalesReturn,
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
