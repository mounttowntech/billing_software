const { round2 } = require("./stockCalculator");

exports.calculateGST = ({ quantity, price, gstPercentage }) => {
  const taxableAmount = round2(Number(quantity) * Number(price));
  const gstAmount = round2((taxableAmount * Number(gstPercentage || 0)) / 100);
  const totalAmount = round2(taxableAmount + gstAmount);

  return { taxableAmount, gstAmount, totalAmount };
};

exports.splitGST = (gstTotal, interstate = false) => {
  const total = round2(gstTotal);

  if (interstate) {
    return { cgst: 0, sgst: 0, igst: total };
  }

  return {
    cgst: round2(total / 2),
    sgst: round2(total / 2),
    igst: 0,
  };
};
