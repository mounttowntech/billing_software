const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["superadmin", "owner", "manager", "cashier", "accountant"],
      required: true,
      unique: true,
    },
    permissions: {
      dashboard: [String],
      products: [String],
      purchases: [String],
      invoices: [String],
      returns: [String],
      payments: [String],
      stock: [String],
      expenses: [String],
      reports: [String],
      restaurant: [String],
      settings: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
