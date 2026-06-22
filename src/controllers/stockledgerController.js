const StockLedger = require("../model/StockLedger");

/*
|--------------------------------------------------------------------------
| Get Stock Ledger
|--------------------------------------------------------------------------
*/

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
