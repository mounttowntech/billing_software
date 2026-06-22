const express = require("express");

const router = express.Router();

const {

createInvoice,

getInvoices,

getInvoiceById,

deleteInvoice

} = require(
"../controllers/invoiceController"
);



router.post(
"/create",
createInvoice
);

router.get(
"/all",
getInvoices
);

router.get(
"/:id",
getInvoiceById
);

router.delete(
"/delete/:id",
deleteInvoice
);

module.exports =
router;