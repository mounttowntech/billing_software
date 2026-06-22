const express = require("express");
const router = express.Router();

const {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/rolePermissionController");

router.post("/create", createRole);
router.get("/all", getRoles);
router.get("/:id", getRoleById);
router.put("/update/:id", updateRole);
router.delete("/delete/:id", deleteRole);

module.exports = router;
