const Purchase = require("../model/purchaseModel");
const { createPurchaseWithStock } = require("../service/purchaseService");

exports.createPurchase = async (req, res) => {
  try {
    const purchase = await createPurchaseWithStock({
      body: req.body,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Purchase created and stock added successfully",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("supplier")
      .populate("items.product items.variant")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};