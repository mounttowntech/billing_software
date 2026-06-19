const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

exports.generateInvoicePDF = async (invoice) => {
  const folder = path.join(__dirname, "../uploads/invoices");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const fileName = `${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(folder, fileName);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice No: ${invoice.invoiceNumber}`);
  doc.text(`Customer: ${invoice.customerName || "-"}`);
  doc.text(`Phone: ${invoice.customerPhone || "-"}`);
  doc.text(`Grand Total: ${invoice.grandTotal}`);
  doc.text(`Paid: ${invoice.paidAmount}`);
  doc.text(`Due: ${invoice.dueAmount}`);

  doc.moveDown();
  doc.text("Items:");

  invoice.items.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.productName} - Qty: ${item.quantity} - Amount: ${item.totalAmount}`);
  });

  doc.end();

  return `/uploads/invoices/${fileName}`;
};
