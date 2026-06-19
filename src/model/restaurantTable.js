const mongoose = require("mongoose");

const restaurantTableSchema = new mongoose.Schema(
  {
    tableNo: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 4 },

    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantTable", restaurantTableSchema);