const Store = require("../model/Store");

exports.createStore = async (req, res) => {
  try {
    const data = await Store.create(req.body);
    res.status(201).json({ success: true, message: "Store created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStores = async (req, res) => {
  try {
    const data = await Store.find(req.query).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const data = await Store.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Store not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const data = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "Store not found" });
    res.json({ success: true, message: "Store updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const data = await Store.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Store not found" });
    res.json({ success: true, message: "Store deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
