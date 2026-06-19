const Unit = require("../model/Unit");

exports.createUnit = async (req, res) => {
  try {
    const data = await Unit.create(req.body);
    res.status(201).json({ success: true, message: "Unit created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnits = async (req, res) => {
  try {
    const data = await Unit.find(req.query).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const data = await Unit.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Unit not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const data = await Unit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "Unit not found" });
    res.json({ success: true, message: "Unit updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const data = await Unit.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Unit not found" });
    res.json({ success: true, message: "Unit deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
