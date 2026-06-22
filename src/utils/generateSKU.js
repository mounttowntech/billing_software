const GarmentProduct =
require("../model/GarmentProduct");

const generateSKU = async (
    industryType,
    productName,
    color,
    size
) => {

    const prefix = "GAR";

    const productPart =
        productName
        .replace(/\s+/g, "")
        .substring(0,5)
        .toUpperCase();

    const colorPart =
        color
        .substring(0,3)
        .toUpperCase();

    const sizePart =
        size.toUpperCase();

    const count =
        await GarmentProduct.countDocuments();

    const serial =
        String(count + 1)
        .padStart(5,"0");

    return `${prefix}-${productPart}-${colorPart}-${sizePart}-${serial}`;
};

module.exports = generateSKU;