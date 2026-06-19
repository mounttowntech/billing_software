const Purchase = require("../model/purchaseModel");
const Product = require("../model/productModel");
const Supplier = require("../model/supplierModel");
const { changeStock } = require("../service/stockService");
const { calculateItemGST, getPaymentStatus, round2 } = require("../service/gstService");
const { createPaymentRecord } = require("../service/paymentService");

exports.createPurchaseWithStock = async ({ body, user }) => {
  const {
    supplier,
    items,
    paidAmount = 0,
    paymentMethod = "cash",
  } = body;

  if (!supplier || !items || items.length === 0) {
    throw new Error("Supplier and items are required");
  }

  const supplierData = await Supplier.findById(supplier);

  if (!supplierData) {
    throw new Error("Supplier not found");
  }

  let subTotal = 0;
  let gstTotal = 0;
  const purchaseItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new Error("Product not found");
    }

    const price = Number(item.price || product.purchasePrice || 0);
    const gstPercentage = Number(item.gstPercentage || product.gstPercentage || 0);

    const calc = calculateItemGST({
      quantity: item.quantity,
      price,
      gstPercentage,
    });

    subTotal += calc.taxableAmount;
    gstTotal += calc.gstAmount;

    purchaseItems.push({
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

  const totalAmount = round2(subTotal + gstTotal);
  const dueAmount = round2(totalAmount - Number(paidAmount));

  const count = await Purchase.countDocuments();

  const purchase = await Purchase.create({
    purchaseNumber: `PUR-${String(count + 1).padStart(6, "0")}`,
    supplier,
    items: purchaseItems,
    subTotal: round2(subTotal),
    gstTotal: round2(gstTotal),
    totalAmount,
    paidAmount,
    dueAmount,
    paymentStatus: getPaymentStatus({ totalAmount, paidAmount }),
    createdBy: user?._id,
  });

  for (const item of purchaseItems) {
    await changeStock({
      productId: item.product,
      variantId: item.variant,
      quantity: item.quantity,
      movementType: "purchase_in",
      referenceModel: "Purchase",
      referenceId: purchase._id,
      note: `Purchase ${purchase.purchaseNumber}`,
      createdBy: user?._id,
    });
  }

  if (Number(paidAmount) > 0) {
    await createPaymentRecord({
      type: "purchase",
      purchase: purchase._id,
      supplier,
      amount: paidAmount,
      method: paymentMethod,
      note: `Purchase payment ${purchase.purchaseNumber}`,
      createdBy: user?._id,
    });
  }

  supplierData.totalPurchaseAmount += totalAmount;
  supplierData.dueAmount += Math.max(0, dueAmount);
  await supplierData.save();

  return purchase;
};