const express = require("express");

const router = express.Router();

const {
  createInvoice,

  getInvoices,

  getInvoiceById,

  updateInvoice,

  deleteInvoice,
} = require("../controllers/invoiceController");

router.post("/create", createInvoice);

router.get("/all", getInvoices);

router.get("/:id", getInvoiceById);

router.put("/update/:id", updateInvoice);

router.delete("/delete/:id", deleteInvoice);

module.exports = router;
