exports.round2 = (num) => {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
};

exports.calculateItemGST = ({ quantity, price, gstPercentage }) => {
  const taxableAmount = exports.round2(Number(quantity) * Number(price));
  const gstAmount = exports.round2(
    (taxableAmount * Number(gstPercentage || 0)) / 100
  );
  const totalAmount = exports.round2(taxableAmount + gstAmount);

  return {
    taxableAmount,
    gstAmount,
    totalAmount,
  };
};

exports.splitGST = ({ gstTotal, interstate = false }) => {
  const total = exports.round2(gstTotal);

  if (interstate) {
    return {
      cgst: 0,
      sgst: 0,
      igst: total,
    };
  }

  return {
    cgst: exports.round2(total / 2),
    sgst: exports.round2(total / 2),
    igst: 0,
  };
};

exports.getPaymentStatus = ({ totalAmount, paidAmount }) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);

  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
};