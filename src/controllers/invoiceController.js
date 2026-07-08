const GarmentInvoice = require("../model/GarmentInvoice");

const GarmentProduct = require("../model/GarmentProduct");

const generateInvoiceNo = require("../utils/generateInvoiceNumber");

const calculateGST = require("../utils/gstCalculator");

const paymentCalculation = require("../utils/paymentCalculation");

const createStockLedger = require("../utils/stockLedger");

/*
|--------------------------------------------------------------------------
| Create Invoice
|--------------------------------------------------------------------------
*/

exports.createInvoice = async (req, res) => {
  try {
    const {
      customer,
      items,
      discountAmount = 0,
      paidAmount = 0,
      paymentMethod,
      remarks,
    } = req.body;

    let subTotal = 0;
    let gstAmount = 0;

    const invoiceItems = [];

    for (const item of items) {
      const product = await GarmentProduct.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product Not Found",
        });
      }

      const variant = product.variants.find((v) => v.skuCode === item.skuCode);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant Not Found",
        });
      }

      if (variant.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Stock For ${product.productName}`,
        });
      }

      const amount = item.quantity * variant.sellingPrice;

      const gstResult = calculateGST(amount, variant.gstPercentage);

      subTotal += amount;
      gstAmount += gstResult.gstAmount;

      variant.currentStock = variant.currentStock - item.quantity;

      await product.save();

      await createStockLedger({
        product: product._id,

        skuCode: variant.skuCode,

        movementType: "sale",

        quantity: item.quantity,

        beforeStock: variant.currentStock + item.quantity,

        afterStock: variant.currentStock,

        referenceNumber: "SALE",

        remarks: "Invoice Sale",
      });

      invoiceItems.push({
        product: product._id,

        skuCode: variant.skuCode,

        barcode: variant.barcode,

        productName: product.productName,

        size: variant.size,

        color: variant.color,

        quantity: item.quantity,

        price: variant.sellingPrice,

        gstPercentage: variant.gstPercentage,

        gstAmount: gstResult.gstAmount,

        totalAmount: gstResult.totalAmount,
      });
    }

    const grandTotal = subTotal + gstAmount - discountAmount;

    const paymentInfo = paymentCalculation(grandTotal, paidAmount);

    const invoiceNo = await generateInvoiceNo();

    const invoice = await GarmentInvoice.create({
      invoiceNo,

      customer,

      items: invoiceItems,

      subTotal,

      discountAmount,

      gstAmount,

      grandTotal,

      paidAmount,

      dueAmount: paymentInfo.balanceAmount,

      returnAmount: paymentInfo.returnAmount,

      paymentStatus: paymentInfo.paymentStatus,

      paymentMethod,

      remarks,
    });

    res.status(201).json({
      success: true,

      message: "Invoice Created Successfully",

      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Invoices
|--------------------------------------------------------------------------
*/

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await GarmentInvoice.find()

      .populate("customer")

      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,

      count: invoices.length,

      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Invoice By Id
|--------------------------------------------------------------------------
*/

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await GarmentInvoice.findById(req.params.id).populate(
      "customer",
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,

        message: "Invoice Not Found",
      });
    }

    res.status(200).json({
      success: true,

      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Invoice
|--------------------------------------------------------------------------
*/

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await GarmentInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,

        message: "Invoice Not Found",
      });
    }

    await invoice.deleteOne();

    res.status(200).json({
      success: true,

      message: "Invoice Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
