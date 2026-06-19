const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["rent", "electricity", "salary", "transport", "marketing", "miscellaneous"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    expenseDate: {
      type: Date,
      default: Date.now,
    },

    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);