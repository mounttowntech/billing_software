const mongoose = require("mongoose");
module.exports = mongoose.model(
  "GarmentMeasurement",
  new mongoose.Schema(
    {
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GarmentCustomer",
      },
      chest: Number,
      waist: Number,
      shoulder: Number,
      sleeve: Number,
      neck: Number,
      hip: Number,
      inseam: Number,
      length: Number,
      notes: String,
    },
    { timestamps: true, versionKey: false },
  ),
);
