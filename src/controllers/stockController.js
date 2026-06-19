const StockLedger = require("../model/stockledger");
const Product = require("../model/productModel");
const ProductVariant = require("../model/productVariant");
const { changeStock } = require("../service/stockService");

exports.adjustStock = async (req, res) => {
  try {
    const { product, variant, quantity, type, note } = req.body;

    await changeStock({
      productId: product,
      variantId: variant,
      quantity,
      movementType: type === "in" ? "adjustment_in" : "adjustment_out",
      referenceModel: "ManualAdjustment",
      note,
      createdBy: req.user?._id,
    });

    res.json({
      success: true,
      message: "Stock adjusted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStockLedger = async (req, res) => {
  try {
    const ledger = await StockLedger.find()
      .populate("product variant")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ledger.length,
      data: ledger,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      hasVariants: false,
      $expr: { $lte: ["$stockQuantity", "$lowStockLimit"] },
    });

    const variants = await ProductVariant.find({
      $expr: { $lte: ["$stockQuantity", "$lowStockLimit"] },
    }).populate("product");

    res.json({
      success: true,
      products,
      variants,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};