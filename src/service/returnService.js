const SalesReturn = require("../models/SalesReturn");
const PurchaseReturn = require("../models/PurchaseReturn");
const Invoice = require("../models/Invoice");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const { changeStock } = require("./stockService");
const { createPaymentRecord } = require("./paymentService");
const { round2 } = require("./gstService");

exports.createSalesReturnService = async ({ body, user }) => {
  const { invoiceId, items, refundMethod = "cash", reason } = body;

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  let totalRefundAmount = 0;
  const returnItems = [];

  for (const item of items) {
    const invoiceItem = invoice.items.find(
      (x) => String(x.product) === String(item.product)
    );

    if (!invoiceItem) {
      throw new Error("Product not found in invoice");
    }

    const availableQty =
      Number(invoiceItem.quantity) - Number(invoiceItem.returnedQuantity || 0);

    if (Number(item.quantity) > availableQty) {
      throw new Error(`${invoiceItem.productName} return quantity exceeded`);
    }

    const oneQtyAmount =
      Number(invoiceItem.totalAmount) / Number(invoiceItem.quantity);

    const refundAmount = round2(oneQtyAmount * Number(item.quantity));

    invoiceItem.returnedQuantity += Number(item.quantity);
    totalRefundAmount += refundAmount;

    returnItems.push({
      product: item.product,
      variant: item.variant || invoiceItem.variant || null,
      productName: invoiceItem.productName,
      quantity: item.quantity,
      refundAmount,
    });
  }

  const count = await SalesReturn.countDocuments();

  const salesReturn = await SalesReturn.create({
    returnNumber: `RET-${String(count + 1).padStart(6, "0")}`,
    invoice: invoice._id,
    customer: invoice.customer,
    items: returnItems,
    totalRefundAmount: round2(totalRefundAmount),
    refundMethod,
    reason,
    createdBy: user?._id,
  });

  for (const item of returnItems) {
    await changeStock({
      productId: item.product,
      variantId: item.variant,
      quantity: item.quantity,
      movementType: "sale_return_in",
      referenceModel: "SalesReturn",
      referenceId: salesReturn._id,
      note: `Sales return ${salesReturn.returnNumber}`,
      createdBy: user?._id,
    });
  }

  invoice.grandTotal = Math.max(0, round2(invoice.grandTotal - totalRefundAmount));
  invoice.dueAmount = Math.max(0, round2(invoice.dueAmount - totalRefundAmount));
  await invoice.save();

  if (invoice.customer) {
    const customer = await Customer.findById(invoice.customer);

    if (customer) {
      customer.totalPurchaseAmount = Math.max(
        0,
        round2(customer.totalPurchaseAmount - totalRefundAmount)
      );
      customer.dueAmount = Math.max(
        0,
        round2(customer.dueAmount - totalRefundAmount)
      );
      await customer.save();
    }
  }

  await createPaymentRecord({
    type: "refund",
    salesReturn: salesReturn._id,
    customer: invoice.customer,
    amount: totalRefundAmount,
    method: refundMethod === "store_credit" ? "wallet" : refundMethod,
    note: `Refund ${salesReturn.returnNumber}`,
    createdBy: user?._id,
  });

  return salesReturn;
};

exports.createPurchaseReturnService = async ({ body, user }) => {
  const { purchaseId, items, reason } = body;

  const purchase = await Purchase.findById(purchaseId);

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  let totalRefundAmount = 0;
  const returnItems = [];

  for (const item of items) {
    const purchaseItem = purchase.items.find(
      (x) => String(x.product) === String(item.product)
    );

    if (!purchaseItem) {
      throw new Error("Product not found in purchase");
    }

    const availableQty =
      Number(purchaseItem.quantity) - Number(purchaseItem.returnedQuantity || 0);

    if (Number(item.quantity) > availableQty) {
      throw new Error(`${purchaseItem.productName} return quantity exceeded`);
    }

    const oneQtyAmount =
      Number(purchaseItem.totalAmount) / Number(purchaseItem.quantity);

    const refundAmount = round2(oneQtyAmount * Number(item.quantity));

    purchaseItem.returnedQuantity += Number(item.quantity);
    totalRefundAmount += refundAmount;

    returnItems.push({
      product: item.product,
      variant: item.variant || purchaseItem.variant || null,
      productName: purchaseItem.productName,
      quantity: item.quantity,
      refundAmount,
    });
  }

  const count = await PurchaseReturn.countDocuments();

  const purchaseReturn = await PurchaseReturn.create({
    returnNumber: `PRET-${String(count + 1).padStart(6, "0")}`,
    purchase: purchase._id,
    supplier: purchase.supplier,
    items: returnItems,
    totalRefundAmount: round2(totalRefundAmount),
    reason,
    createdBy: user?._id,
  });

  for (const item of returnItems) {
    await changeStock({
      productId: item.product,
      variantId: item.variant,
      quantity: item.quantity,
      movementType: "purchase_return_out",
      referenceModel: "PurchaseReturn",
      referenceId: purchaseReturn._id,
      note: `Purchase return ${purchaseReturn.returnNumber}`,
      createdBy: user?._id,
    });
  }

  purchase.totalAmount = Math.max(0, round2(purchase.totalAmount - totalRefundAmount));
  purchase.dueAmount = Math.max(0, round2(purchase.dueAmount - totalRefundAmount));
  await purchase.save();

  const supplier = await Supplier.findById(purchase.supplier);

  if (supplier) {
    supplier.totalPurchaseAmount = Math.max(
      0,
      round2(supplier.totalPurchaseAmount - totalRefundAmount)
    );
    supplier.dueAmount = Math.max(
      0,
      round2(supplier.dueAmount - totalRefundAmount)
    );
    await supplier.save();
  }

  return purchaseReturn;
};