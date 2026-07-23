const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

const {verifyToken}=require("../middleware/authMiddleware");
const {allowRoles} =require("../middleware/roleMiddleware");

/* ======================================================
   Cashfree Payment APIs
====================================================== */

// Create Payment Order
router.post(
  "/create",
  verifyToken,
  paymentController.createPayment
);

// Verify Payment Status
router.post(
  "/verify/:orderId",
  verifyToken,
  paymentController.verifyPayment
);

// Cashfree Webhook
router.post(
  "/webhook",
  paymentController.cashfreeWebhook
);

// Refund Payment
router.post(
  "/refund/:paymentId",
  verifyToken,
  paymentController.refundPayment
);

/* ======================================================
   CRUD APIs
====================================================== */

// Get All Payments
router.get(
  "/all",
  verifyToken,
  paymentController.getPayments
);

// Get Payment By ID
router.get(
  "/:id",
  verifyToken,
  paymentController.getPaymentById
);

// Update Payment
router.put(
  "/:id",
  verifyToken,
  paymentController.updatePayment
);

// Delete Payment
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Super Admin", "Admin"),
  paymentController.deletePayment
);

module.exports = router;