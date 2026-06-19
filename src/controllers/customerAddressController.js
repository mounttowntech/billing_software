const CustomerAddress = require("../model/CustomerAddress");

exports.createCustomerAddress = async (req, res) => {
  try {
    const data = await CustomerAddress.create(req.body);
    res.status(201).json({ success: true, message: "CustomerAddress created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerAddresss = async (req, res) => {
  try {
    const data = await CustomerAddress.find(req.query).populate("customer").sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerAddressById = async (req, res) => {
  try {
    const data = await CustomerAddress.findById(req.params.id).populate("customer");
    if (!data) return res.status(404).json({ success: false, message: "CustomerAddress not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomerAddress = async (req, res) => {
  try {
    const data = await CustomerAddress.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "CustomerAddress not found" });
    res.json({ success: true, message: "CustomerAddress updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCustomerAddress = async (req, res) => {
  try {
    const data = await CustomerAddress.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "CustomerAddress not found" });
    res.json({ success: true, message: "CustomerAddress deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
