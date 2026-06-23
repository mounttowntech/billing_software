const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const schema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      unique: true,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: String,

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RolePermission",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    resetPasswordOTP: String,

    resetPasswordOTPExpire: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

schema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(
    this.password,
    10
  );
});

module.exports = mongoose.model("User", schema);
