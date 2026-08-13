const axios = require("axios");
const Payment = require("../model/Payment");
const generatePaymentNo = require("../utils/generatePaymentNo");
const crypto = require("crypto");
const generateInvoiceNo = require("../utils/generateInvoiceNumber");
const GarmentCustomer = require("../model/GarmentCustomer");
const Product = require("../model/GarmentProduct");
const Invoice = require("../model/GarmentInvoice");
const updateSaleStock = require("../utils/stockUpdate");

const {
  createInvoiceFromPayment,
} = require("../service/invoiceService");

const {
  reduceStockForSale,
} = require("../service/stockService");
/* ============================================================
   Create Payment (Cashfree)
============================================================ */

exports.createPayment = async (req, res) => {
  try {
    let response = null;
    const {
      type,
      customer,
      supplier,
      invoice,
      purchase,
      amount,
      remarks,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      items = [],
      subTotal = 0,
      gstAmount = 0,
      discount = 0,
      paidAmount = 0,
      dueAmount = 0,
      returnAmount = 0
    } = req.body;



    // ==========================================
    // VALIDATION
    // ==========================================

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Payment type is required",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    // Sale must contain items
    if (type === "sale" && (!items || items.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Sale items are required",
      });
    }

    // Generate Payment Number
    const paymentNo = await generatePaymentNo();

    // Cashfree Order ID
    const cashfreeOrderId = `ORDER_${Date.now()}`;

    const paymentData = {
  paymentNo,
  type,
  amount : Number(amount),
  remarks,

  customerName,
  customerEmail,
  customerPhone,

  paymentMethod,
  paymentStatus: "pending",
  cashfreeOrderId,
  items: type === "sale" ? items : [],
  subTotal: Number(subTotal),
  gstAmount: Number(gstAmount),

  createdBy: req.user?._id || null,
};

if (type === "sale") {
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Sale payment must contain at least one item",
    });
  }
}

// Sale & Refund Payment
if (type === "sale" || type === "refund") {
  paymentData.customer = customer;
  paymentData.invoice = invoice;
}

// Purchase Payment
if (type === "purchase") {
  paymentData.supplier = supplier;
  paymentData.purchase = purchase;
}

const payment = await Payment.create(paymentData);

    // Save Pending Payment
    // const payment = await Payment.create({
    //   paymentNo,
    //   type,
    //   customer,
    //   supplier,
    //   invoice,
    //   purchase,
    //   amount,
    //   remarks,

    //   customerName,
    //   customerEmail,
    //   customerPhone,

    //   paymentMethod: "cashfree",
    //   paymentStatus: "pending",

    //   cashfreeOrderId,

    //   createdBy: req.user?._id,
    // });

    // ==========================================
    // CREATE INVOICE FOR SALE
    // ==========================================

    let invoiceDocument = null;

    if (type === "sale") {
      // If frontend already sent invoice
      if (invoice) {
        invoiceDocument = await Invoice.findById(invoice);

        if (!invoiceDocument) {
          return res.status(404).json({
            success: false,
            message: "Invoice not found",
          });
        }
      }

      // ========================================
      // CREATE NEW INVOICE
      // ========================================

      else {
        const invoiceNo = await generateInvoiceNo();

        const invoiceItems = [];

        for (const item of items) {
          const product = await Product.findById(item.product);

          if (!product) {
            return res.status(404).json({
              success: false,
              message: `Product not found: ${item.product}`,
            });
          }

          let productName = product.name;

          // Variant
          if (item.variant) {
            const variant = await ProductVariant.findById(
              item.variant
            );

            if (!variant) {
              return res.status(404).json({
                success: false,
                message: `Variant not found: ${item.variant}`,
              });
            }

            productName =
              `${product.name} - ${variant.sku}`;
          }

          invoiceItems.push({
            product: item.product,
            variant: item.variant || null,
            productName,

            quantity: Number(item.quantity),

            price: Number(item.price),

            amount: Number(item.amount),
          });
        }

        invoiceDocument = await Invoice.create({
          invoiceNo,

          customer: customer || null,

          customerName:
            customerName || "Walk-in Customer",

          customerEmail:
            customerEmail || null,

          customerPhone:
            customerPhone || null,

          items: invoiceItems,

          subTotal: Number(subTotal),

          gstAmount: Number(gstAmount),

          discount: Number(discount),

          grandTotal: Number(amount),

          paymentMethod,

          paymentStatus:
            paymentMethod === "cash"
              ? "paid"
              : "pending",

          invoiceStatus: "confirmed",

          paidAmount:
            paymentMethod === "cash"
              ? Number(paidAmount || amount)
              : 0,

          dueAmount:
            paymentMethod === "cash"
              ? Number(dueAmount || 0)
              : Number(amount),

          returnAmount:
            paymentMethod === "cash"
              ? Number(returnAmount || 0)
              : 0,

          payment: payment._id,

          createdBy: req.user?._id || null,
        });

        // Connect payment to invoice
        payment.invoice = invoiceDocument._id;

        payment.invoiceCreated = true;

        await payment.save();
      }
    }

    // ==========================================
    // CASH PAYMENT
    // ==========================================

    if (paymentMethod === "cash") {
      payment.orderStatus = "PAID";

      payment.paymentStatus = "completed";

      await payment.save();

      // ----------------------------------------
      // REDUCE STOCK
      // ----------------------------------------

      if (type === "sale") {
        await updateSaleStock(payment);
      }

      // ----------------------------------------
      // UPDATE INVOICE
      // ----------------------------------------

      if (payment.invoice) {
        await Invoice.findByIdAndUpdate(
          payment.invoice,
          {
            paymentStatus: "paid",

            paymentMethod: "cash",

            paidAmount: Number(paidAmount || amount),

            dueAmount: Number(dueAmount || 0),

            returnAmount: Number(returnAmount || 0),

            payment: payment._id,
          },
          {
            new: true,
          }
        );
      }

      return res.status(201).json({
        success: true,

        message: "Cash payment completed successfully",

        data: {
          paymentId: payment._id,

          paymentNo: payment.paymentNo,

          invoiceId: payment.invoice,

          amount: payment.amount,

          paymentStatus: payment.paymentStatus,

          paymentMethod: "cash",

          paidAmount: Number(paidAmount || amount),

          dueAmount: Number(dueAmount || 0),

          returnAmount: Number(returnAmount || 0),

          stockUpdated: payment.stockUpdated,
        },
      });
    }

    // ==========================================
    // CASHFREE PAYMENT
    // ==========================================

    if (paymentMethod === "cashfree") {
      response = await axios.post(
        `${process.env.CASHFREE_ENV}/pg/orders`,
        {
          order_id: cashfreeOrderId,

          order_amount: Number(amount),

          order_currency: "INR",

          customer_details: {
            customer_id: customer
              ? customer.toString()
              : payment._id.toString(),

            customer_name:
              customerName || "Walk-in Customer",

            customer_email:
              customerEmail ||
              "customer@gmail.com",

            customer_phone:
              customerPhone ||
              "9999999999",
          },

          order_note:
            remarks || "POS Sale Payment",

          order_meta: {
            return_url:
              `${process.env.FRONTEND_URL}/payments?order_id={order_id}`,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",

            "x-client-id":
              process.env.CASHFREE_APP_ID,

            "x-client-secret":
              process.env.CASHFREE_SECRET_KEY,

            "x-api-version": "2023-08-01",
          },
        }
      );

      // ========================================
      // SAVE CASHFREE RESPONSE
      // ========================================

      payment.paymentSessionId =
        response.data.payment_session_id;

      payment.orderStatus =
        response.data.order_status;

      payment.paymentStatus = "pending";

      payment.gatewayResponse =
        response.data;

      await payment.save();

      return res.status(201).json({
        success: true,

        message:
          "Cashfree payment order created successfully",

        data: {
          paymentId: payment._id,

          paymentNo: payment.paymentNo,

          invoiceId: payment.invoice,

          amount: payment.amount,

          paymentStatus:
            payment.paymentStatus,

          cashfreeOrderId:
            payment.cashfreeOrderId,

          paymentSessionId:
            payment.paymentSessionId,

          orderStatus:
            payment.orderStatus,
        },
      });
    }

    // ==========================================
    // INVALID PAYMENT METHOD
    // ==========================================

    return res.status(400).json({
      success: false,
      message: "Unsupported payment method",
    });
  } catch (error) {
    console.error(
      "CREATE PAYMENT ERROR:",
      error.response?.data || error
    );

    return res.status(500).json({
      success: false,

      message:
        error.response?.data?.message ||
        error.message,
    });
  }

    // Create Cashfree Order
  //   if(paymentMethod == 'cashfree') {
  //    response = await axios.post(
  //     `${process.env.CASHFREE_ENV}/pg/orders`,
  //     {
  //       order_id: cashfreeOrderId,

  //       order_amount: amount,

  //       order_currency: "INR",

  //       customer_details: {
  //         customer_id: customer
  //           ? customer.toString()
  //           : supplier
  //           ? supplier.toString()
  //           : payment._id.toString(),

  //         customer_name: customerName || "Customer",

  //         customer_email:
  //           customerEmail || "customer@example.com",

  //         customer_phone:
  //           customerPhone || "9999999999",
  //       },

  //       order_note: remarks || "Payment",

  //       order_meta: {
  //         return_url:
  //           `${process.env.FRONTEND_URL}/payments?order_id={order_id}`
  //           ,
  //       },
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",

  //         "x-client-id": process.env.CASHFREE_APP_ID,

  //         "x-client-secret":
  //           process.env.CASHFREE_SECRET_KEY,

  //         "x-api-version": "2023-08-01",
  //       },
  //     }
  //   );

  //   // Update Payment
  //   payment.paymentSessionId =
  //     response.data.payment_session_id;

  //   payment.orderStatus = response.data.order_status;

  //   payment.gatewayResponse = response.data;
  // }else if(paymentMethod == 'cash') {
  //   payment.orderStatus = "PAID";
  //   payment.paymentStatus = "completed";
  // }

    // await payment.save();

    //reduce product count from stock if payment is completed and type is sale


  //   return res.status(201).json({
  //     success: true,
  //     message: "Payment order created successfully",

  //     data: {
  //       paymentId: payment._id,

  //       paymentNo: payment.paymentNo,

  //       amount: payment.amount,

  //       paymentStatus: payment.paymentStatus,

  //       cashfreeOrderId: paymentMethod == 'cashfree' ?   payment.cashfreeOrderId : null,

  //       paymentSessionId:  paymentMethod == 'cashfree' ?   response.data.payment_session_id : null,

  //       orderStatus:  paymentMethod == 'cashfree' ?   response.data.order_status : null,
  //     },
  //   });
  // } catch (error) {
  //   console.error(error.response?.data || error);

  //   return res.status(500).json({
  //     success: false,
  //     message:
  //       error.response?.data?.message || error.message,
  //   });
  // }
};



/* ==========================================================
   Verify Cashfree Payment
========================================================== */

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find payment in database
    const payment = await Payment.findOne({
      cashfreeOrderId: orderId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Verify payment from Cashfree
    const response = await axios.get(
      `${process.env.CASHFREE_ENV}/pg/orders/${orderId}/payments`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
        },
      }
    );

    const payments = response.data;

    if (!payments || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No payment found for this order.",
      });
    }

    // Get latest payment
    const latestPayment = payments[payments.length - 1];

    payment.cashfreePaymentId = latestPayment.cf_payment_id;
    payment.gatewayResponse = latestPayment;

    switch (latestPayment.payment_status) {
      case "SUCCESS":
        payment.paymentStatus = "completed";
        payment.orderStatus = "PAID";
        payment.paymentDate = new Date();
        break;

      case "FAILED":
        payment.paymentStatus = "failed";
        payment.orderStatus = "FAILED";
        break;

      case "PENDING":
        payment.paymentStatus = "pending";
        payment.orderStatus = "ACTIVE";
        break;

      default:
        payment.paymentStatus = "pending";
        payment.orderStatus = latestPayment.payment_status;
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      data: payment,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to verify payment.",
    });
  }
};

// ======================================================
// Cashfree Webhook
// ======================================================




// exports.cashfreeWebhook = async (req, res) => {
//   try {
//     // ===========================================
//     // Verify Signature (Optional but Recommended)
//     // ===========================================

//     const signature = req.headers["x-webhook-signature"];

//     if (signature) {
//       const generatedSignature = crypto
//         .createHmac(
//           "sha256",
//           process.env.CASHFREE_WEBHOOK_SECRET
//         )
//         .update(JSON.stringify(req.body))
//         .digest("base64");

//       if (signature !== generatedSignature) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid webhook signature",
//         });
//       }
//     }

//     // ===========================================
//     // Webhook Payload
//     // ===========================================

//     const data = req.body;

//     const orderId =
//       data.data?.order?.order_id ||
//       data.order?.order_id;

//     const paymentId =
//       data.data?.payment?.cf_payment_id ||
//       data.payment?.cf_payment_id;

//     const paymentStatus =
//       data.data?.payment?.payment_status ||
//       data.payment?.payment_status;

//     const paymentAmount =
//       data.data?.payment?.payment_amount ||
//       data.payment?.payment_amount;

//     // ===========================================
//     // Find Payment
//     // ===========================================

//     const payment = await Payment.findOne({
//       cashfreeOrderId: orderId,
//     });

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }

//     // ===========================================
//     // Save Webhook Response
//     // ===========================================

//     payment.webhookResponse = data;

//     payment.cashfreePaymentId = paymentId;

//     payment.gatewayResponse = data;

//     payment.paymentDate = new Date();

//     // ===========================================
//     // Update Status
//     // ===========================================

//     switch (paymentStatus) {
//       case "SUCCESS":
//         payment.paymentStatus = "completed";
//         payment.orderStatus = "PAID";
//         break;

//       case "FAILED":
//         payment.paymentStatus = "failed";
//         payment.orderStatus = "FAILED";
//         break;

//       case "USER_DROPPED":
//         payment.paymentStatus = "failed";
//         payment.orderStatus = "CANCELLED";
//         break;

//       case "PENDING":
//         payment.paymentStatus = "pending";
//         payment.orderStatus = "ACTIVE";
//         break;

//       default:
//         payment.paymentStatus = "pending";
//         payment.orderStatus = "ACTIVE";
//     }

//     // ===========================================
//     // Update Amount
//     // ===========================================

//     if (paymentAmount) {
//       payment.amount = paymentAmount;
//     }

//     await payment.save();

//     console.log(
//       "Cashfree Webhook Updated:",
//       payment.paymentNo
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Webhook processed successfully",
//     });
//   } catch (error) {
//     console.error("Cashfree Webhook Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


exports.cashfreeWebhook = async (req, res) => {
  try {
    console.log(
      "======================================"
    );

    console.log("CASHFREE WEBHOOK RECEIVED");

    console.log(
      "======================================"
    );

    const data = req.body;

    console.log(
      "Webhook Data:",
      JSON.stringify(data, null, 2)
    );

    // ============================================
    // GET ORDER ID
    // ============================================

    const orderId =
      data.data?.order?.order_id ||
      data.order?.order_id ||
      data.order_id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Cashfree order ID not found",
      });
    }

    // ============================================
    // GET PAYMENT DETAILS
    // ============================================

    const paymentData =
      data.data?.payment ||
      data.payment ||
      {};

    const paymentId =
      paymentData.cf_payment_id ||
      paymentData.cf_paymentId ||
      null;

    const paymentStatus =
      paymentData.payment_status ||
      paymentData.paymentStatus ||
      data.data?.payment_status ||
      data.payment_status;

    const paymentAmount =
      paymentData.payment_amount ||
      paymentData.order_amount ||
      data.data?.order?.order_amount ||
      data.order?.order_amount;

    // ============================================
    // FIND PAYMENT
    // ============================================

    const payment =
      await Payment.findOne({
        cashfreeOrderId: orderId,
      });

    if (!payment) {
      console.log(
        "Payment not found:",
        orderId
      );

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ============================================
    // SAVE WEBHOOK RESPONSE
    // ============================================

    payment.webhookResponse = data;

    payment.gatewayResponse = data;

    payment.cashfreePaymentId =
      paymentId;

    payment.paymentDate =
      new Date();

    // ============================================
    // SUCCESS
    // ============================================

    if (
      paymentStatus === "SUCCESS" ||
      paymentStatus === "PAID"
    ) {
      // ==========================================
      // IDEMPOTENCY
      // ==========================================

      if (
        payment.paymentStatus ===
          "completed" &&
        payment.invoice
      ) {
        console.log(
          "Payment already completed:",
          payment.paymentNo
        );

        return res.status(200).json({
          success: true,
          message:
            "Payment already processed",
        });
      }

      // ==========================================
      // UPDATE PAYMENT
      // ==========================================

      payment.paymentStatus =
        "completed";

      payment.orderStatus =
        "PAID";

      if (paymentAmount) {
        payment.amount =
          Number(paymentAmount);
      }

      await payment.save();

      // ==========================================
      // SALE
      // ==========================================

      if (payment.type === "sale") {
        // ========================================
        // CREATE INVOICE
        // ========================================

        const invoice =
          await createInvoiceFromPayment({
            payment,
            userId:
              payment.createdBy,
          });

        // ========================================
        // REDUCE STOCK
        // ========================================

        await reduceStockForSale({
          items: payment.items,

          referenceId:
            invoice._id,

          referenceNo:
            invoice.invoiceNo,

          userId:
            payment.createdBy,
        });

        // ========================================
        // UPDATE CUSTOMER
        // ========================================

        if (payment.customer) {
          await GarmentCustomer.findByIdAndUpdate(
            payment.customer,
            {
              $inc: {
                totalPurchaseAmount:
                  payment.amount,

                loyaltyPoints:
                  Math.floor(
                    payment.amount / 100
                  ),
              },
            }
          );
        }

        console.log(
          "Invoice created:",
          invoice.invoiceNo
        );

        console.log(
          "Stock reduced successfully"
        );
      }

      console.log(
        "Payment completed:",
        payment.paymentNo
      );
    }

    // ============================================
    // FAILED
    // ============================================

    else if (
      paymentStatus === "FAILED"
    ) {
      payment.paymentStatus =
        "failed";

      payment.orderStatus =
        "FAILED";

      await payment.save();

      console.log(
        "Cashfree payment failed:",
        payment.paymentNo
      );
    }

    // ============================================
    // USER DROPPED
    // ============================================

    else if (
      paymentStatus === "USER_DROPPED"
    ) {
      payment.paymentStatus =
        "cancelled";

      payment.orderStatus =
        "CANCELLED";

      await payment.save();

      console.log(
        "Customer cancelled payment:",
        payment.paymentNo
      );
    }

    // ============================================
    // PENDING
    // ============================================

    else {
      payment.paymentStatus =
        "pending";

      payment.orderStatus =
        "ACTIVE";

      await payment.save();

      console.log(
        "Payment still pending:",
        payment.paymentNo
      );
    }

    // ============================================
    // RESPONSE TO CASHFREE
    // ============================================

    return res.status(200).json({
      success: true,
      message:
        "Cashfree webhook processed successfully",
    });
  } catch (error) {
    console.error(
      "Cashfree Webhook Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// Refund Payment
// ======================================================

exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount } = req.body;

    // ==========================================
    // Find Payment
    // ==========================================

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ==========================================
    // Validate Payment Status
    // ==========================================

    if (payment.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded.",
      });
    }

    // ==========================================
    // Validate Refund Amount
    // ==========================================

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund amount.",
      });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds payment amount.",
      });
    }

    // ==========================================
    // Cashfree Refund API
    // ==========================================

    const refundId = `REFUND_${Date.now()}`;

    const response = await axios.post(
      `${process.env.CASHFREE_ENV}/pg/orders/${payment.cashfreeOrderId}/refunds`,
      {
        refund_id: refundId,
        refund_amount: refundAmount,
        refund_note: "Customer Refund",
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
        },
      }
    );

    const refund = response.data;

    // ==========================================
    // Update Database
    // ==========================================

    payment.refundId = refund.refund_id || refundId;

    payment.refundAmount = refundAmount;

    payment.refundStatus =
      refund.refund_status?.toLowerCase() || "pending";

    if (
      payment.refundStatus === "processed" ||
      payment.refundStatus === "success"
    ) {
      payment.paymentStatus = "refunded";
    }

    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      refundResponse: refund,
    };

    await payment.save();

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Refund initiated successfully.",
      data: payment,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};
// ======================================================
// Get All Payments
// ======================================================

exports.getPayments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Payment Status
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    // Payment Type
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Payment Method
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    // Customer
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    // Supplier
    if (req.query.supplier) {
      filter.supplier = req.query.supplier;
    }

    // Search
    if (req.query.search) {
      filter.$or = [
        {
          paymentNo: {
            $regex: req.query.search,
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: req.query.search,
            $options: "i",
          },
        },
        {
          customerPhone: {
            $regex: req.query.search,
            $options: "i",
          },
        },
        {
          cashfreeOrderId: {
            $regex: req.query.search,
            $options: "i",
          },
        },
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("customer", "customerName phone")
        .populate("supplier", "supplierName phone")
        .populate("invoice", "invoiceNo")
        .populate("purchase", "purchaseNo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Get Payment By ID
// ======================================================

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("customer", "customerName phone email")
      .populate("supplier", "supplierName phone email")
      .populate("invoice", "invoiceNo invoiceDate grandTotal")
      .populate("purchase", "purchaseNo purchaseDate totalAmount")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ======================================================
// Update Payment
// ======================================================

exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Prevent updating completed payments
    if (payment.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed payment cannot be updated.",
      });
    }

    const paymentData = { ...req.body };

    // Remove restricted fields
    delete paymentData.paymentNo;
    delete paymentData.cashfreeOrderId;
    delete paymentData.cashfreePaymentId;
    delete paymentData.paymentSessionId;
    delete paymentData.orderToken;
    delete paymentData.gatewayResponse;
    delete paymentData.webhookResponse;
    delete paymentData.createdBy;
    delete paymentData.createdAt;

    // Remove empty values
    Object.keys(paymentData).forEach((key) => {
      if (
        paymentData[key] === "" ||
        paymentData[key] === null ||
        paymentData[key] === undefined
      ) {
        delete paymentData[key];
      }
    });

    paymentData.updatedBy = req.user?._id;

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      paymentData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("customer", "customerName phone")
      .populate("supplier", "supplierName phone")
      .populate("invoice", "invoiceNo")
      .populate("purchase", "purchaseNo")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      data: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ==========================================================
   Delete Payment
========================================================== */

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Don't allow deleting completed online payments
    if (
      payment.paymentMethod === "cashfree" &&
      payment.paymentStatus === "completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed Cashfree payments cannot be deleted. Please refund instead.",
      });
    }

    await Payment.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};