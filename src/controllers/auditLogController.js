const AuditLog = require("../model/AuditLog");

exports.createAuditLog = async (req, res) => {
  try {
    const data = await AuditLog.create(req.body);
    res.status(201).json({ success: true, message: "AuditLog created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const data = await AuditLog.find(req.query).populate("user").sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const data = await AuditLog.findById(req.params.id).populate("user");
    if (!data) return res.status(404).json({ success: false, message: "AuditLog not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAuditLog = async (req, res) => {
  try {
    const data = await AuditLog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "AuditLog not found" });
    res.json({ success: true, message: "AuditLog updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAuditLog = async (req, res) => {
  try {
    const data = await AuditLog.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "AuditLog not found" });
    res.json({ success: true, message: "AuditLog deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
