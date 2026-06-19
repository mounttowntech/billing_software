const Invoice = require("../model/invoiceModel");
const { createInvoiceWithStock } = require("../service/invoiceService");

exports.createInvoice = async (req, res) => {
  try {
    const invoice = await createInvoiceWithStock({
      body: req.body,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("customer table")
      .populate("items.product items.variant")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};