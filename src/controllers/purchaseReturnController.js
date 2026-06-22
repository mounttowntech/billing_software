const PurchaseReturn = require("../model/PurchaseReturn");

exports.createPurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.create(req.body);

    res.status(201).json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPurchaseReturns = async (req, res) => {
  try {
    const returns = await PurchaseReturn.find();

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

exports.getPurchaseReturnById = async (req, res) => {
  try {
    const data = await PurchaseReturn.findById(req.params.id);

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

exports.deletePurchaseReturn = async (req, res) => {
  try {
    await PurchaseReturn.findByIdAndDelete(req.params.id);

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
