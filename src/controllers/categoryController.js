const Category = require("../model/Category");

exports.createCategory = async (req, res) => {
  try {
    const data = await Category.create(req.body);
    res.status(201).json({ success: true, message: "Category created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategorys = async (req, res) => {
  try {
    const data = await Category.find(req.query).populate("parent").sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const data = await Category.findById(req.params.id).populate("parent");
    if (!data) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const data = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const data = await Category.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
