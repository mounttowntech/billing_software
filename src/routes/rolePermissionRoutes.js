const router = require("express").Router();
const c = require("../controllers/rolePermissionController");

router.post("/", c.createRolePermission);
router.get("/", c.getRolePermissions);
router.get("/:id", c.getRolePermissionById);
router.put("/:id", c.updateRolePermission);
router.delete("/:id", c.deleteRolePermission);

module.exports = router;
