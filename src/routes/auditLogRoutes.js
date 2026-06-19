const router = require("express").Router();
const c = require("../controllers/auditLogController");

router.post("/create", c.createAuditLog);
router.get("/all", c.getAuditLogs);
router.get("/:id", c.getAuditLogById);
router.put("/:id", c.updateAuditLog);
router.delete("/:id", c.deleteAuditLog);

module.exports = router;
