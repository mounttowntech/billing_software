const TaxSetting = require("../model/TaxSetting");

exports.createTaxSetting = async (req, res) => {
  try {
    const data = await TaxSetting.create(req.body);
    res.status(201).json({ success: true, message: "TaxSetting created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaxSettings = async (req, res) => {
  try {
    const data = await TaxSetting.find(req.query).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaxSettingById = async (req, res) => {
  try {
    const data = await TaxSetting.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "TaxSetting not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTaxSetting = async (req, res) => {
  try {
    const data = await TaxSetting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "TaxSetting not found" });
    res.json({ success: true, message: "TaxSetting updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTaxSetting = async (req, res) => {
  try {
    const data = await TaxSetting.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "TaxSetting not found" });
    res.json({ success: true, message: "TaxSetting deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
