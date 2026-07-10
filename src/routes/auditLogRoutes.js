const express = require("express");
const router = express.Router();

const {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  updateAuditLogById,
  deleteAuditLog,
} = require("../controllers/auditLogController");
router.post("/create",createAuditLog);
router.get("/all", getAuditLogs);
router.get("/:id", getAuditLogById);
router.put(
  "/update/:id",
 updateAuditLogById
);

router.delete("/delete/:id", deleteAuditLog);

module.exports = router;
