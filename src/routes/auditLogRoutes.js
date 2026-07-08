const express = require("express");
const router = express.Router();

const {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  deleteAuditLog,
} = require("../controllers/auditLogController");
router.post("/create",createAuditLog);
router.get("/all", getAuditLogs);
router.get("/:id", getAuditLogById);
router.delete("/delete/:id", deleteAuditLog);

module.exports = router;
