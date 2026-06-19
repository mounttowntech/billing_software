const Invoice = require("../model/invoiceModel");
const Product = require("../model/productModel");
const Customer = require("../model/customerModel");
const KitchenOrder = require("../model/kitchenOrder");
const { changeStock, consumeRecipe } = require("../service/stockService");
const { calculateItemGST, splitGST, getPaymentStatus, round2 } = require("../service/gstService");
const { createPaymentRecord } = require("../service/paymentService");

exports.createInvoiceWithStock = async ({ body, user }) => {
  const {
    industryType,
    orderType = "retail",
    table,
    tableNo,
    customer,
    customerName,
    customerPhone,
    items,
    discount = 0,
    paidAmount = 0,
    paymentMethod = "cash",
    interstate = false,
  } = body;

  if (!industryType || !items || items.length === 0) {
    throw new Error("Industry type and items are required");
  }

  let subTotal = 0;
  let gstTotal = 0;
  const invoiceItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new Error("Product not found");
    }

    const price = Number(item.price || product.sellingPrice || 0);
    const gstPercentage = Number(product.gstPercentage || 0);

    const calc = calculateItemGST({
      quantity: item.quantity,
      price,
      gstPercentage,
    });

    subTotal += calc.taxableAmount;
    gstTotal += calc.gstAmount;

    invoiceItems.push({
      product: product._id,
      variant: item.variant || null,
      productName: product.name,
      quantity: item.quantity,
      price,
      gstPercentage,
      taxableAmount: calc.taxableAmount,
      gstAmount: calc.gstAmount,
      totalAmount: calc.totalAmount,
    });
  }

  const grandTotal = round2(subTotal + gstTotal - Number(discount));
  const dueAmount = round2(grandTotal - Number(paidAmount));
  const gstSplit = splitGST({ gstTotal, interstate });

  const count = await Invoice.countDocuments();

  const invoice = await Invoice.create({
    invoiceNumber: `INV-${String(count + 1).padStart(6, "0")}`,
    industryType,
    orderType,
    table,
    tableNo,
    customer,
    customerName,
    customerPhone,
    items: invoiceItems,
    subTotal: round2(subTotal),
    gstTotal: round2(gstTotal),
    cgst: gstSplit.cgst,
    sgst: gstSplit.sgst,
    igst: gstSplit.igst,
    discount,
    grandTotal,
    paidAmount,
    dueAmount,
    paymentStatus: getPaymentStatus({ totalAmount: grandTotal, paidAmount }),
    paymentMethod,
    orderStatus: industryType === "restaurant" ? "kitchen" : "completed",
    createdBy: user?._id,
  });

  for (const item of invoiceItems) {
    const product = await Product.findById(item.product);

    if (product.type === "menu_item" && product.recipe?.length > 0) {
      await consumeRecipe({
        menuProduct: product,
        quantity: item.quantity,
        referenceId: invoice._id,
        createdBy: user?._id,
      });
    } else if (product.type !== "service") {
      await changeStock({
        productId: item.product,
        variantId: item.variant,
        quantity: item.quantity,
        movementType: "sale_out",
        referenceModel: "Invoice",
        referenceId: invoice._id,
        note: `Invoice ${invoice.invoiceNumber}`,
        createdBy: user?._id,
      });
    }
  }

  if (industryType === "restaurant") {
    const kotCount = await KitchenOrder.countDocuments();

    await KitchenOrder.create({
      kotNumber: `KOT-${String(kotCount + 1).padStart(6, "0")}`,
      invoice: invoice._id,
      table,
      tableNo,
      items: invoiceItems.map((item) => ({
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
      })),
    });
  }

  if (Number(paidAmount) > 0) {
    await createPaymentRecord({
      type: "sale",
      invoice: invoice._id,
      customer,
      amount: paidAmount,
      method: paymentMethod,
      note: `Invoice payment ${invoice.invoiceNumber}`,
      createdBy: user?._id,
    });
  }

  if (customer) {
    const customerData = await Customer.findById(customer);

    if (customerData) {
      customerData.totalPurchaseAmount += grandTotal;
      customerData.dueAmount += Math.max(0, dueAmount);
      customerData.loyaltyPoints += Math.floor(grandTotal / 100);
      await customerData.save();
    }
  }

  return invoice;
};