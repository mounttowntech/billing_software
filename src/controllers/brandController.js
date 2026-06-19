const Brand = require("../model/Brand");

exports.createBrand = async (req, res) => {
  try {
    const data = await Brand.create(req.body);
    res.status(201).json({ success: true, message: "Brand created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const data = await Brand.find(req.query).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const data = await Brand.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Brand not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const data = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "Brand not found" });
    res.json({ success: true, message: "Brand updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const data = await Brand.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Brand not found" });
    res.json({ success: true, message: "Brand deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
