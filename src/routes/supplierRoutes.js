const express = require("express");
const router = express.Router();

const supplierController = require("../controllers/supplierController");

router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getSuppliers);
// router.get("/:id", supplierController.getSupplierById);
router.put("/:id", supplierController.updateSupplier);

// Add this only if deleteSupplier exists in controller
router.delete("/:id", supplierController.deleteSupplier);

module.exports = router;