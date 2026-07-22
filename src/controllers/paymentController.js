const Payment = require("../model/Payment");
const generatePaymentNo = require("../utils/generatePaymentNo");

// exports.createPayment = async (req, res) => {
//   try {
//     const payment = await Payment.create(req.body);

//     res.status(201).json({
//       success: true,
//       data: payment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.createPayment = async (req, res) => {
  try {
    const paymentData = { ...req.body };

    Object.keys(paymentData).forEach((key) => {
      if (
        paymentData[key] === "" ||
        paymentData[key] === null ||
        paymentData[key] === undefined
      ) {
        delete paymentData[key];
      }
    });

    paymentData.paymentNo = await generatePaymentNo();

    const payment = await Payment.create(paymentData);

    res.status(201).json({
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

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()

      .populate("customer", "customerName phone")

      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
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

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    res.json({
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

// exports.updatePayment = async (req, res) => {
//   try {
//     const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({
//       success: true,
//       data: payment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.updatePayment = async (req, res) => {
  try {
    const paymentData = { ...req.body };

    Object.keys(paymentData).forEach((key) => {
      if (
        paymentData[key] === "" ||
        paymentData[key] === null ||
        paymentData[key] === undefined
      ) {
        delete paymentData[key];
      }
    });

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      paymentData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
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

exports.deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Payment Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
