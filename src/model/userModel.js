const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: String,

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["superadmin", "owner", "manager", "cashier", "accountant"],
      default: "cashier",
    },

    businessName: String,

    industryType: {
      type: String,
      enum: ["garments", "restaurant", "departmental_store"],
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);