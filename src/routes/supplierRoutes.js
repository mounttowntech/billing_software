const express = require("express");

const router = express.Router();

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

router.post("/create", createSupplier);

router.get("/all", getSuppliers);

router.get("/:id", getSupplierById);

router.put("/update/:id", updateSupplier);

router.delete("/delete/:id", deleteSupplier);

module.exports = router;
