const Invoice = require("../models/invoiceModel");

module.exports = async () => {
  const count = await Invoice.countDocuments();
  return `INV-${String(count + 1).padStart(6, "0")}`;
};
