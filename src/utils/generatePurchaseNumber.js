const Purchase = require("../models/purchaseModel");

module.exports = async () => {
  const count = await Purchase.countDocuments();
  return `PUR-${String(count + 1).padStart(6, "0")}`;
};
