const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Unit",
  new mongoose.Schema(
    {
      name: String,
      shortName: String,
      allowDecimal: Boolean,
      description: String,
    },
    { timestamps: true, versionKey: false },
  ),
);
