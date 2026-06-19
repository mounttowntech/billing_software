const Razorpay = require("razorpay");

const isRazorpayConfigured =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

exports.createRazorpayOrder = async ({ amount, currency = "INR", receipt }) => {
  if (!razorpay) throw new Error("Razorpay keys are not configured");

  return razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt,
  });
};

exports.razorpay = razorpay;
