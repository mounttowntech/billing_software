const User = require("../model/User");
const bcrypt = require("bcryptjs");
const generateOTP = require("../utils/generateOTP");

const sendMail = require("../utils/sendMail");



exports.createUser = async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role
    } = req.body;

    const count =
      await User.countDocuments();

    const employeeCode =
      `EMP${String(count + 1).padStart(4, "0")}`;

    const existingUser =
      await User.findOne({
        $or: [
          { email },
          { phone }
        ]
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const user =
      await User.create({
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        password,
        role
      });

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("role");

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    user.resetPasswordOTP = otp;

    user.resetPasswordOTPExpire =
      new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendMail({
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family:Arial">
          <h2>Billing Software</h2>
          <p>Your OTP for password reset:</p>
          <h1>${otp}</h1>
          <p>Valid for 10 minutes only.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to registered email"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    res.status(200).json({
      success: true,

      message: "OTP verified",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.password = newPassword;

    user.resetPasswordOTP = undefined;

    user.resetPasswordOTPExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,

      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
