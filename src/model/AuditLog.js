const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    module: String,
    referenceId: mongoose.Schema.Types.ObjectId,
    oldValue: Object,
    newValue: Object,
    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
