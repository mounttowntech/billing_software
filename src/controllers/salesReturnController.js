const SalesReturn = require("../model/SalesReturn");

const GarmentProduct = require("../model/GarmentProduct");

const stockCalculation = require("../utils/stockCalculator");

const createStockLedger = require("../utils/stockLedger");

// Create Sales Return





exports.createSalesReturn = async (req, res) => {

  try {

    const {

      product,

      skuCode,

      quantity,

      refundAmount,

      reason,

    } = req.body;



    // ===============================

    // Validation

    // ===============================



    if (!product) {

      return res.status(400).json({

        success: false,

        message: "Product is required.",

      });

    }



    if (!skuCode) {

      return res.status(400).json({

        success: false,

        message: "SKU Code is required.",

      });

    }



    if (!quantity || quantity <= 0) {

      return res.status(400).json({

        success: false,

        message: "Quantity must be greater than zero.",

      });

    }



    // ===============================

    // Find Product

    // ===============================



    const item = await GarmentProduct.findById(product);



    if (!item) {

      return res.status(404).json({

        success: false,

        message: "Product not found.",

      });

    }



    // ===============================

    // Find Variant

    // ===============================



    const variant = item.variants.find(

      (v) =>

        String(v.skuCode).trim().toUpperCase() ===

        String(skuCode).trim().toUpperCase()

    );



    if (!variant) {

      return res.status(404).json({

        success: false,

        message: "Variant not found.",

        receivedSku: skuCode,

        availableSkus: item.variants.map((v) => v.skuCode),

      });

    }



    // ===============================

    // Stock Calculation

    // ===============================



    const stock = stockCalculation(

      variant.currentStock,

      quantity,

      "sales_return"

    );



    variant.currentStock = stock.afterStock;



    item.totalStock = item.variants.reduce(

      (sum, v) => sum + (v.currentStock || 0),

      0

    );



    await item.save();



    // ===============================

    // Stock Ledger

    // ===============================



    await createStockLedger({

      product: item._id,

      skuCode,

      movementType: "sales_return",

      quantity,

      beforeStock: stock.beforeStock,

      afterStock: stock.afterStock,

      referenceNumber: "SALES_RETURN",

      remarks: reason || "Sales Return",

    });



    // ===============================

    // Sales Return

    // ===============================



    const salesReturn = await SalesReturn.create({

      product,

      skuCode,

      quantity,

      refundAmount,

      reason,

    });



    return res.status(201).json({

      success: true,

      message: "Sales return created successfully.",

      data: salesReturn,

    });

  } catch (error) {

    console.error("Sales Return Error:", error);



    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
exports.getSalesReturns = async (req, res) => {
  try {
    const returns = await SalesReturn.find().populate("product", "productName _id");

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
