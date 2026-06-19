const ProductVariant = require("../model/productVariant");
const Product = require("../model/productModel");

exports.createVariant = async (req, res) => {
  try {
    const product = await Product.findById(req.body.product);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingSKU = await ProductVariant.findOne({
      sku: req.body.sku,
    });

    if (existingSKU) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const variant = await ProductVariant.create(req.body);

    res.status(201).json({
      success: true,
      message: "Variant created successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getVariants = async (req, res) => {
  try {
    const { productId, search } = req.query;

    let filter = {};

    if (productId) {
      filter.product = productId;
    }

    let query = ProductVariant.find(filter)
      .populate("product", "name sku industryType")
      .sort({ createdAt: -1 });

    const variants = await query;

    let result = variants;

    if (search) {
      result = variants.filter(
        (item) =>
          item.sku?.toLowerCase().includes(search.toLowerCase()) ||
          item.color?.toLowerCase().includes(search.toLowerCase()) ||
          item.size?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getVariantById = async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id).populate(
      "product",
      "name sku industryType"
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      message: "Variant updated successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    await variant.deleteOne();

    res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateVariantStock = async (req, res) => {
  try {
    const { stockQuantity } = req.body;

    const variant = await ProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    variant.stockQuantity = stockQuantity;

    await variant.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};