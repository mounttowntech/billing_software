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

exports.updatePurchase = async (req, res) => {
  try {
    const { supplier, items, paidAmount } = req.body;

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,

        message: "Purchase not found",
      });
    }

    // ============================================

    // Reverse Old Stock

    // ============================================

    for (const oldItem of purchase.items) {
      const product = await GarmentProduct.findById(oldItem.product);

      if (!product) continue;

      const variant = product.variants.find(
        (v) => v.skuCode === oldItem.skuCode,
      );

      if (!variant) continue;

      const stock = stockCalculation(
        variant.currentStock,

        oldItem.quantity,

        "sale", // reverse purchase
      );

      variant.currentStock = stock.afterStock;

      await product.save();
    }

    // Delete Previous Ledger Entries (Optional)

    if (StockLedger) {
      await StockLedger.deleteMany({
        referenceNumber: purchase.purchaseNo,
      });
    }

    // ============================================

    // Apply New Stock

    // ============================================

    let subTotal = 0;

    let gstAmount = 0;

    for (const item of items) {
      const product = await GarmentProduct.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,

          message: `Product not found`,
        });
      }

      const variant = product.variants.find((v) => v.skuCode === item.skuCode);

      if (!variant) {
        return res.status(404).json({
          success: false,

          message: `Variant ${item.skuCode} not found`,
        });
      }

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

        referenceNumber: purchase.purchaseNo,

        remarks: "Purchase Updated",
      });

      subTotal += Number(item.totalAmount || 0);

      gstAmount += Number(item.gstAmount || 0);
    }

    const grandTotal = subTotal + gstAmount;

    purchase.supplier = supplier;

    purchase.items = items;

    purchase.subTotal = subTotal;

    purchase.gstAmount = gstAmount;

    purchase.grandTotal = grandTotal;

    purchase.paidAmount = paidAmount;

    purchase.dueAmount = grandTotal - paidAmount;

    purchase.paymentStatus = paidAmount >= grandTotal ? "paid" : "partial";

    await purchase.save();

    res.status(200).json({
      success: true,

      message: "Purchase updated successfully",

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
