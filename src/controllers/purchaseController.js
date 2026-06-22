const Purchase = require("../model/Purchase");

const GarmentProduct = require("../model/GarmentProduct");

const generatePurchaseNo = require("../utils/generatePurchaseNumber");

const stockCalculation = require("../utils/stockCalculator");

const createStockLedger = require("../utils/stockLedger");

//  Create Purchase
exports.createPurchase = async (req, res) => {
  try {
    const { supplier, items, paidAmount } = req.body;

    let subTotal = 0;
    let gstAmount = 0;

    for (const item of items) {
      const product = await GarmentProduct.findById(item.product);

      const variant = product.variants.find((v) => v.skuCode === item.skuCode);

      const stock = stockCalculation(
        variant.currentStock,
        item.quantity,
        "purchase",
      );

      variant.currentStock = stock.afterStock;

      await product.save();

      await createStockLedger({
        product: product._id,

        skuCode: item.skuCode,

        movementType: "purchase",

        quantity: item.quantity,

        beforeStock: stock.beforeStock,

        afterStock: stock.afterStock,

        referenceNumber: "PURCHASE",

        remarks: "Purchase Entry",
      });

      subTotal += item.totalAmount || 0;
      gstAmount += item.gstAmount || 0;
    }

    const grandTotal = subTotal + gstAmount;

    const purchaseNo = await generatePurchaseNo();

    const purchase = await Purchase.create({
      purchaseNo,

      supplier,

      items,

      subTotal,

      gstAmount,

      grandTotal,

      paidAmount,

      dueAmount: grandTotal - paidAmount,

      paymentStatus: paidAmount >= grandTotal ? "paid" : "partial",
    });

    res.status(201).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Purchases

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate("supplier");

    res.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    await Purchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
