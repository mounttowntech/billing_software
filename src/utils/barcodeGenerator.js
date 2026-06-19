exports.generateBarcode = (sku) => {
  return `BAR-${sku || "SKU"}-${Date.now()}`;
};
