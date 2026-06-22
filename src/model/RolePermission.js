const mongoose = require("mongoose");
module.exports = mongoose.model(
  "RolePermission",
  new mongoose.Schema(
    {
      roleName: { type: String, unique: true },
      permissions: [
        {
          module: String,
          create: Boolean,
          read: Boolean,
          update: Boolean,
          delete: Boolean,
        },
      ],
    },
    { timestamps: true, versionKey: false },
  ),
);
