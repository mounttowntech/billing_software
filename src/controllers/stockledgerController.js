const StockLedger = require("../model/StockLedger");


exports.createStockLedger = async (req, res) => {
  try {
    const {
      product,
      skuCode,
      movementType,
      quantity,
      beforeStock,
      afterStock,
      referenceNumber,
      remarks,
    } = req.body;

    if (
      !product ||
      !skuCode ||
      !movementType ||
      quantity === undefined ||
      beforeStock === undefined ||
      afterStock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product, SKU Code, Movement Type, Quantity, Before Stock and After Stock are required.",
      });
    }

    const ledger = await StockLedger.create({
      product,
      skuCode,
      movementType,
      quantity,
      beforeStock,
      afterStock,
      referenceNumber,
      remarks,
    });

    const populatedLedger = await StockLedger.findById(
      ledger._id
    ).populate("product", "productName");

    res.status(201).json({
      success: true,
      message: "Stock Ledger created successfully.",
      data: populatedLedger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getStockLedgers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const ledgers = await StockLedger.find()

      .populate("product", "productName")

      .sort({
        createdAt: -1,
      })

      .skip(skip)

      .limit(limit);

    const total = await StockLedger.countDocuments();

    res.json({
      success: true,
      total,
      page,
      limit,
      data: ledgers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStockLedgerById = async (req, res) => {
  try {
    const ledger = await StockLedger.findById(req.params.id);

    res.json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateStockLedgerById = async (req, res) => {
  try {
    const ledger = await StockLedger.findById(req.params.id);

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Stock Ledger not found.",
      });
    }

    const updatedLedger =
      await StockLedger.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate("product", "productName");

    res.status(200).json({
      success: true,
      message: "Stock Ledger updated successfully.",
      data: updatedLedger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteStockLedger = async (req, res) => {
  try {
    await StockLedger.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ledger Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
