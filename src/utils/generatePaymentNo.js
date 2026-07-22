const Payment = require("../model/Payment");

const generatePaymentNo = async () => {
  const lastPayment = await Payment.findOne()
    .sort({ createdAt: -1 })
    .select("paymentNo");

  let nextNumber = 1;

  if (lastPayment?.paymentNo) {
    const number = parseInt(lastPayment.paymentNo.replace("PAY", ""), 10);
    nextNumber = number + 1;
  }

  return `PAY${String(nextNumber).padStart(6, "0")}`;
};

module.exports = generatePaymentNo;