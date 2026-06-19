const Payment = require("../model/paymentModel");
const Invoice = require("../model/invoiceModel");
const Purchase = require("../model/purchaseModel");
const Customer = require("../model/customerModel");
const Supplier = require("../model/supplierModel");
const { round2, getPaymentStatus } = require("../service/gstService");

exports.createPaymentRecord = async ({
  type,
  invoice,
  purchase,
  salesReturn,
  customer,
  supplier,
  amount,
  method,
  note,
  createdBy,
}) => {
  const count = await Payment.countDocuments();

  const payment = await Payment.create({
    paymentNumber: `PAY-${String(count + 1).padStart(6, "0")}`,
    type,
    invoice,
    purchase,
    salesReturn,
    customer,
    supplier,
    amount,
    method,
    note,
    createdBy,
  });

  if (type === "sale" && invoice) {
    const invoiceData = await Invoice.findById(invoice);

    if (invoiceData) {
      invoiceData.paidAmount = round2(invoiceData.paidAmount + Number(amount));
      invoiceData.dueAmount = Math.max(
        0,
        round2(invoiceData.grandTotal - invoiceData.paidAmount)
      );

      invoiceData.paymentStatus = getPaymentStatus({
        totalAmount: invoiceData.grandTotal,
        paidAmount: invoiceData.paidAmount,
      });

      await invoiceData.save();

      if (invoiceData.customer) {
        const customerData = await Customer.findById(invoiceData.customer);

        if (customerData) {
          customerData.dueAmount = Math.max(
            0,
            round2(customerData.dueAmount - Number(amount))
          );

          await customerData.save();
        }
      }
    }
  }

  if (type === "purchase" && purchase) {
    const purchaseData = await Purchase.findById(purchase);

    if (purchaseData) {
      purchaseData.paidAmount = round2(purchaseData.paidAmount + Number(amount));
      purchaseData.dueAmount = Math.max(
        0,
        round2(purchaseData.totalAmount - purchaseData.paidAmount)
      );

      purchaseData.paymentStatus = getPaymentStatus({
        totalAmount: purchaseData.totalAmount,
        paidAmount: purchaseData.paidAmount,
      });

      await purchaseData.save();

      if (purchaseData.supplier) {
        const supplierData = await Supplier.findById(purchaseData.supplier);

        if (supplierData) {
          supplierData.dueAmount = Math.max(
            0,
            round2(supplierData.dueAmount - Number(amount))
          );

          await supplierData.save();
        }
      }
    }
  }

  return payment;
};