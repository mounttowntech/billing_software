const Store = require("../model/Store");

exports.createStore = async (req, res) => {
  try {
    const store = await Store.create(req.body);

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find();

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    await Store.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Store deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
