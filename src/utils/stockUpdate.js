const Product  = require("../model/GarmentProduct");

const updateSaleStock = async (payment) => {
    console.log("updateSaleStock called for payment:", payment);
  // ==========================================
  // Prevent duplicate stock deduction
  // ==========================================

  if (payment.stockUpdated) {
    return;
  }

  // ==========================================
  // Only SALE payment
  // ==========================================

  if (payment.type !== "sale") {
    return;
  }

  // ==========================================
  // Validate items
  // ==========================================

  if (!payment.items || payment.items.length === 0) {
    throw new Error("No sale items found for stock update");
  }

  // ==========================================
  // Process every item
  // ==========================================

  for (const item of payment.items) {
    const quantity = Number(item.quantity);

    if (!quantity || quantity <= 0) {
      throw new Error(
        `Invalid quantity for product ${item.product}`
      );
    }

    // ==========================================
    // Find Product
    // ==========================================

    const product = await Product.findById(item.product);
console.log("product", product);
    if (!product) {
      throw new Error(
        `Product not found: ${item.product}`
      );
    }

    // ==========================================
    // VARIANT PRODUCT
    // Variant is embedded inside Product
    // ==========================================

    if (item.variant) {
      const variant = product.variants.id(item.variant);
console.log("variant_product", variant);
      if (!variant) {
        throw new Error(
          `Product variant not found: ${item.variant}`
        );
      }

      // ========================================
      // Check Variant Stock
      // ========================================

      if (variant.stockQuantity < quantity) {
        throw new Error(
          `Insufficient stock for SKU ${variant.skuCode}`
        );
      }

      // ========================================
      // Reduce Variant Stock
      // ========================================

      variant.stockQuantity -= quantity;

      // ========================================
      // Save Product
      // ========================================

      await product.save();
    }

    // ==========================================
    // SIMPLE PRODUCT
    // ==========================================

    else {
      if (product.stockQuantity < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}`
        );
      }

      // ========================================
      // Reduce Product Stock
      // ========================================

      product.stockQuantity -= quantity;

      await product.save();
    }
  }

  // ==========================================
  // Mark Stock Updated
  // ==========================================

  payment.stockUpdated = true;

  await payment.save();
};

module.exports = updateSaleStock;