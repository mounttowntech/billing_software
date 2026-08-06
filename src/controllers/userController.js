const User = require("../model/User");
const bcrypt = require("bcryptjs");
const generateOTP = require("../utils/generateOTP");

const sendMail = require("../utils/sendMail");

const generateToken = require("../utils/generateToken");

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const count = await User.countDocuments();

    const employeeCode = `EMP${String(count + 1).padStart(4, "0")}`;

    const user = await User.create({
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
    });

    const populatedUser = await User.findById(user._id).populate("role");

    const token = generateToken(populatedUser);

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      user: populatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const user = await User.findOne({ email })
      .select("+password")
      .populate("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    const token = generateToken(user);

    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user,
    });
  } catch (error) {
    console.log(error);

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
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;

    user.resetPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000);

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
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;

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
exports.resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
      confirmPassword
    } = req.body;


    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }


    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match"
      });
    }


    const user = await User.findOne({ email })
      .select("+password");


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }


    // Check OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }


    // Check OTP Expiry
    if (user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }


    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );


    user.password = hashedPassword;


    // Clear OTP after successful reset
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;


    await user.save();


    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });


  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message
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
    const { firstName, lastName, email, phone, role, password } = req.body;

    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      role,
    };

    // Update password only if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
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
