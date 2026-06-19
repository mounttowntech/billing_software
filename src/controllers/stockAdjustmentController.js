const StockAdjustment = require("../model/StockAdjustment");
const { changeStock } = require("../service/stockService");

exports.createStockAdjustment = async (req, res) => {
  try {
    const { product, variant, adjustmentType, quantity, reason } = req.body;

    const data = await StockAdjustment.create({
      product,
      variant,
      adjustmentType,
      quantity,
      reason,
      createdBy: req.user?._id,
    });

    await changeStock({
      productId: product,
      variantId: variant,
      quantity,
      movementType: adjustmentType === "increase" ? "adjustment_in" : "adjustment_out",
      referenceModel: "StockAdjustment",
      referenceId: data._id,
      note: reason,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: "Stock adjusted", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStockAdjustments = async (req, res) => {
  try {
    const data = await StockAdjustment.find(req.query)
      .populate("product variant createdBy")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
