const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, businessName, industryType } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || "owner",
      businessName,
      industryType,
    });

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      token: createToken(user),
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      token: createToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        industryType: user.industryType,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};