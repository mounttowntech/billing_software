const AuditLog = require("../model/AuditLog");

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()

      .populate("user", "firstName lastName")

      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAuditLog = async (req, res) => {
  try {
    await AuditLog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Audit log deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
