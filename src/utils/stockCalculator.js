exports.round2 = (num) => {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
};

exports.getPaymentStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);

  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
};
