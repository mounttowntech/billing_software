const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentSize",
  new mongoose.Schema(
    {
      sizeCode: String,
      sizeName: { type: String, required: true },
      displayOrder: Number,
      chest: Number,
      waist: Number,
      hip: Number,
      status: Boolean,
    },
    { timestamps: true },
  ),
);
