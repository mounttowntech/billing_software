const generateVariantCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `VAR-${timestamp}-${random}`;
};

module.exports = generateVariantCode;