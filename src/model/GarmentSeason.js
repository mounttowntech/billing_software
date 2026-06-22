const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentSeason",
  new mongoose.Schema(
    {
      seasonCode: String,
      seasonName: { type: String, required: true },
      startMonth: Number,
      endMonth: Number,
      status: Boolean,
    },
    { timestamps: true },
  ),
);
