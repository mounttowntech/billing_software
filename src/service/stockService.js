const Product = require("../model/GarmentProduct");
// const ProductVariant = require("../model/productVariant");
const StockLedger = require("../model/stockledger");

const stockInTypes = ["purchase_in", "sale_return_in", "adjustment_in"];

exports.changeStock = async ({
  productId,
  variantId = null,
  quantity,
  movementType,
  referenceModel,
  referenceId,
  note,
  createdBy,
}) => {
  const qty = Number(quantity);

  if (qty <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const isStockIn = stockInTypes.includes(movementType);

  let beforeStock = 0;
  let afterStock = 0;

  if (variantId) {
    // const variant = await ProductVariant.findById(variantId);
const variant = {};
    if (!variant) {
      throw new Error("Variant not found");
    }

    beforeStock = Number(variant.stockQuantity || 0);
    afterStock = isStockIn ? beforeStock + qty : beforeStock - qty;

    if (afterStock < 0) {
      throw new Error(`${product.name} variant stock not enough`);
    }

    variant.stockQuantity = afterStock;
    await variant.save();
  } else {
    beforeStock = Number(product.stockQuantity || 0);
    afterStock = isStockIn ? beforeStock + qty : beforeStock - qty;

    if (afterStock < 0) {
      throw new Error(`${product.name} stock not enough`);
    }

    product.stockQuantity = afterStock;
    await product.save();
  }

  await StockLedger.create({
    product: productId,
    variant: variantId,
    movementType,
    quantity: qty,
    beforeStock,
    afterStock,
    referenceModel,
    referenceId,
    note,
    createdBy,
  });

  return {
    product,
    beforeStock,
    afterStock,
  };
};

exports.consumeRecipe = async ({ menuProduct, quantity, referenceId, createdBy }) => {
  if (!menuProduct.recipe || menuProduct.recipe.length === 0) return;

  for (const item of menuProduct.recipe) {
    await exports.changeStock({
      productId: item.ingredient,
      quantity: Number(item.quantity) * Number(quantity),
      movementType: "recipe_consumption",
      referenceModel: "Invoice",
      referenceId,
      note: `Recipe used for ${menuProduct.name}`,
      createdBy,
    });
  }
};

exports.reduceStockForSale = async ({
  items,
  referenceId,
  referenceNo,
  userId,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No items found for stock reduction");
  }

  for (const item of items) {
    const quantity = Number(item.quantity);

    if (!quantity || quantity <= 0) {
      throw new Error(
        `Invalid quantity for product ${item.product}`
      );
    }

    // ============================================
    // GARMENT VARIANT STOCK
    // ============================================

    if (item.variant) {
      const variant = await ProductVariant.findById(
        item.variant
      );

      if (!variant) {
        throw new Error(
          `Product variant not found: ${item.variant}`
        );
      }

      if (variant.stockQuantity < quantity) {
        throw new Error(
          `Insufficient stock for SKU ${variant.sku}`
        );
      }

      const previousStock = variant.stockQuantity;

      variant.stockQuantity -= quantity;

      await variant.save();

      await StockLedger.create({
        product: item.product,
        variant: item.variant,

        transactionType: "sale",

        quantity: -quantity,

        previousStock,
        newStock: variant.stockQuantity,

        referenceId,
        referenceNo,

        createdBy: userId,
      });

      continue;
    }

    // ============================================
    // NORMAL PRODUCT STOCK
    // ============================================

    const product = await Product.findById(item.product);

    if (!product) {
      throw new Error(
        `Product not found: ${item.product}`
      );
    }

    if (product.stockQuantity < quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}`
      );
    }

    const previousStock = product.stockQuantity;

    product.stockQuantity -= quantity;

    await product.save();

    await StockLedger.create({
      product: item.product,

      transactionType: "sale",

      quantity: -quantity,

      previousStock,
      newStock: product.stockQuantity,

      referenceId,
      referenceNo,

      createdBy: userId,
    });
  }

  return true;
};