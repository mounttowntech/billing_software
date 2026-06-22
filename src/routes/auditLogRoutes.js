const express = require("express");
const router = express.Router();

const {
  getAuditLogs,
  getAuditLogById,
  deleteAuditLog,
} = require("../controllers/auditLogController");

router.get("/all", getAuditLogs);
router.get("/:id", getAuditLogById);
router.delete("/:id", deleteAuditLog);

module.exports = router;
