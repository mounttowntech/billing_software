const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    logNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RolePermission",
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },

    module: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "Create",
        "Update",
        "Delete",
        "View",
        "Login",
        "Logout",
        "Export",
        "Import",
        "Print",
        "Approve",
        "Reject",
      ],
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    requestMethod: {
      type: String,
      trim: true,
    },

    requestUrl: {
      type: String,
      trim: true,
    },

    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    browser: {
      type: String,
      trim: true,
    },

    device: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Success", "Failed", "Warning"],
      default: "Success",
    },

    errorMessage: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ==========================================
   Auto Generate Log Number
========================================== */

auditLogSchema.pre("save", async function () {
  if (!this.isNew || this.logNumber) return;

  const lastLog = await this.constructor.findOne().sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastLog?.logNumber) {
    const num = parseInt(lastLog.logNumber.replace("AUD", ""), 10);

    if (!isNaN(num)) {
      nextNumber = num + 1;
    }
  }

  this.logNumber = `AUD${String(nextNumber).padStart(6, "0")}`;
});
/* ==========================================
   Virtual
========================================== */

auditLogSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

/* ==========================================
   Indexes
========================================== */

auditLogSchema.index({ logNumber: 1 });

auditLogSchema.index({ module: 1 });

auditLogSchema.index({ action: 1 });

auditLogSchema.index({ user: 1 });

auditLogSchema.index({ role: 1 });

auditLogSchema.index({ store: 1 });

auditLogSchema.index({ status: 1 });

auditLogSchema.index({ createdAt: -1 });

/* ==========================================
   JSON
========================================== */

auditLogSchema.set("toJSON", {
  virtuals: true,
});

auditLogSchema.set("toObject", {
  virtuals: true,
});

/* ==========================================
   Export
========================================== */

module.exports = mongoose.model("AuditLog", auditLogSchema);
