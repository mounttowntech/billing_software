const AuditLog = require("../model/AuditLog");

exports.createAuditLog = async (req, res) => {
  try {

    const {
      user,
      module,
      action,
      referenceId,
      oldValue,
      newValue,
      ipAddress
    } = req.body;

    if (!user || !module || !action) {
      return res.status(400).json({
        success: false,
        message: "User, module and action are required."
      });
    }

    const auditLog = await AuditLog.create({
      user,
      module,
      action,
      referenceId,
      oldValue,
      newValue,
      ipAddress:
        ipAddress ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress
    });

    res.status(201).json({
      success: true,
      message: "Audit log created successfully.",
      data: auditLog
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()

      .populate("user", "firstName lastName");

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
