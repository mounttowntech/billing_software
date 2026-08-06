const AuditLog = require("../model/AuditLog");

exports.createAuditLog = async (req, res) => {
  try {
    const {
      user,
      role,
      store,
      module,
      action,
      recordId,
      description,
      oldValues,
      newValues,
      status,
      errorMessage,
      ipAddress,
    } = req.body;

    if (!user || !module || !action || !description) {
      return res.status(400).json({
        success: false,
        message: "User, module, action and description are required.",
      });
    }

    const auditLog = await AuditLog.create({
      user,
      role,
      store,
      module,
      action,
      recordId,
      description,
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      requestBody: req.body,
      oldValues,
      newValues,
      ipAddress:
        ipAddress || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      browser: req.headers["user-agent"],
      device: req.headers["sec-ch-ua-platform"] || "Unknown",
      status: status || "Success",
      errorMessage: errorMessage || "",
    });

    res.status(201).json({
      success: true,
      message: "Audit log created successfully.",
      data: auditLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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

exports.updateAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await AuditLog.findById(id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,

        message: "Audit Log not found",
      });
    }

    const updatedAuditLog = await AuditLog.findByIdAndUpdate(
      id,

      {
        user: req.body.user,

        role: req.body.role,

        store: req.body.store,

        module: req.body.module,

        action: req.body.action,

        recordId: req.body.recordId,

        description: req.body.description,

        requestMethod: req.body.requestMethod,

        requestUrl: req.body.requestUrl,

        requestBody: req.body.requestBody,

        oldValues: req.body.oldValues,

        newValues: req.body.newValues,

        ipAddress: req.body.ipAddress,

        browser: req.body.browser,

        device: req.body.device,

        status: req.body.status,

        errorMessage: req.body.errorMessage,
      },

      {
        new: true,

        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,

      message: "Audit Log updated successfully.",

      data: updatedAuditLog,
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
    const { id } = req.params;

    const auditLog = await AuditLog.findByIdAndDelete(id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit Log not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Audit Log deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
