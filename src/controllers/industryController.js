const Industry = require("../model/Industry");

exports.createIndustry = async (req, res) => {
  try {
    const data = await Industry.create(req.body);
    res.status(201).json({ success: true, message: "Industry created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIndustrys = async (req, res) => {
  try {
    const data = await Industry.find(req.query).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIndustryById = async (req, res) => {
  try {
    const data = await Industry.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Industry not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateIndustry = async (req, res) => {
  try {
    const data = await Industry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "Industry not found" });
    res.json({ success: true, message: "Industry updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteIndustry = async (req, res) => {
  try {
    const data = await Industry.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Industry not found" });
    res.json({ success: true, message: "Industry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
