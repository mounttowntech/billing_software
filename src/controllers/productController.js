const GarmentProduct = require("../model/GarmentProduct");

const generateSKU = require("../utils/generateSKU");

const generateBarcode = require("../utils/generateBarcode");

const generateVariantCode = require("../utils/generateVariantCode");

/*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/

exports.createProduct = async (req, res) => {
  try {
    // Parse variants from FormData
    if (req.body.variants) {
      req.body.variants = JSON.parse(req.body.variants);
    }

    // Save uploaded image filename
    if (req.file) {
      req.body.image = req.file.filename;
    }

    const {
      productCode,
      productName,
      category,
      brand,
      fabric,
      season,
      style,
      gender,
      description,
      variants,
    } = req.body;

    const image = req.file ? req.file.filename : "";

    /*
|--------------------------------------------------------------------------
| Duplicate Product Check
|--------------------------------------------------------------------------
*/

    const existingProduct = await GarmentProduct.findOne({
      productCode,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product Code Already Exists",
      });
    }

    /*
|--------------------------------------------------------------------------
| Generate SKU + Barcode
|--------------------------------------------------------------------------
*/

    const finalVariants = [];

    for (const variant of variants) {
      const skuCode =
        variant.skuCode ||
        (await generateSKU(
          "garments",
          productName,
          variant.color,
          variant.size,
        ));

      const barcode = variant.barcode || generateBarcode();

      const variantCode = variant?.variantCode || generateVariantCode();

      let discountType =
        variant.discountType !== undefined
          ? variant.discountType
          : "percentage";

        let discountValue =
        discountType == "percentage"
          ? Number(variant.discountPercentage || 0)
          : Number(variant?.discountAmount || 0);

      finalVariants.push({
        ...variant,

        skuCode,

        barcode,
        variantCode,
        discountType,
        discountValue,
      });
    }

    /*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/
    console.log("image is :", image);
    const product = await GarmentProduct.create({
      productCode,

      productName,

      category,

      brand,

      fabric,

      season,

      style,

      gender,

      description,
      image,
      variants: finalVariants,
    });

    console.log(product);
    console.log("Saved image:", product.image);

    res.status(201).json({
      success: true,

      message: "Product Created Successfully",

      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

exports.getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      productName: {
        $regex: search,
        $options: "i",
      },
    };

    const total = await GarmentProduct.countDocuments(query);

    const products = await GarmentProduct.find(query)

      .populate("category")

      .populate("brand")

      .populate("fabric")

      .populate("season")

      .populate("style")

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit);

    res.status(200).json({
      success: true,

      total,

      page,

      limit,

      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Product By Id
|--------------------------------------------------------------------------
*/

exports.getProductById = async (req, res) => {
  try {
    const product = await GarmentProduct.findById(req.params.id)

      .populate("category")

      .populate("brand")

      .populate("fabric")

      .populate("season")

      .populate("style");

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product Not Found",
      });
    }

    res.status(200).json({
      success: true,

      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Search By SKU
|--------------------------------------------------------------------------
*/

exports.searchBySKU = async (req, res) => {
  try {
    const sku = req.params.sku;

    const product = await GarmentProduct.findOne({
      "variants.skuCode": sku,
    });

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "SKU Not Found",
      });
    }

    res.json({
      success: true,

      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Search By Barcode
|--------------------------------------------------------------------------
*/

exports.searchByBarcode = async (req, res) => {
  try {
    const barcode = req.params.barcode;

    const product = await GarmentProduct.findOne({
      "variants.barcode": barcode,
    });

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Barcode Not Found",
      });
    }

    res.json({
      success: true,

      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Product
|--------------------------------------------------------------------------
*/

// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await GarmentProduct.findByIdAndUpdate(
//       req.params.id,

//       req.body,

//       {
//         new: true,
//         runValidators: true,
//       },
//     )

//       .populate("category")
//       .populate("brand");

//     res.status(200).json({
//       success: true,

//       message: "Product Updated Successfully",

//       data: product,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,

//       message: error.message,
//     });
//   }
// };

// exports.updateProduct = async (req, res) => {
//   try {
//     const updateData = { ...req.body };

//     const product = await GarmentProduct.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     // Convert variants string to array
//     if (updateData.variants && typeof updateData.variants === "string") {
//       updateData.variants = JSON.parse(updateData.variants);
//     }

//     // Save uploaded image if a new one is selected
//     if (req.file) {
//       updateData.image = req.file.filename; // or req.file.path
//     }

//     const product = await GarmentProduct.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       {
//         new: true,
//         runValidators: true,
//       },
//     )
//       .populate("category")
//       .populate("brand");

//     res.status(200).json({
//       success: true,
//       message: "Product Updated Successfully",
//       data: product,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // ============================================================
    // FIND EXISTING PRODUCT
    // ============================================================

    const product = await GarmentProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ============================================================
    // COPY REQUEST DATA
    // ============================================================

    const updateData = { ...req.body };

    // ============================================================
    // CONVERT VARIANTS STRING TO ARRAY
    // ============================================================

    if (
      updateData.variants &&
      typeof updateData.variants === "string"
    ) {
      try {
        updateData.variants = JSON.parse(updateData.variants);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid variants JSON format",
        });
      }
    }

    // ============================================================
    // PRODUCT NAME
    // ============================================================

    const productName =
      updateData.productName || product.productName;

    // ============================================================
    // PROCESS VARIANTS
    // ============================================================

    if (Array.isArray(updateData.variants)) {
      const existingVariants = product.variants || [];

      const finalVariants = [];
      
      for (const variant of updateData.variants) {
        let existingVariant = null;

        // ============================================================
        // 1. FIND BY VARIANT CODE
        // ============================================================

        if (variant.variantCode) {
          existingVariant = existingVariants.find(
            (oldVariant) =>
              oldVariant.variantCode === variant.variantCode
          );
        }

        // ============================================================
        // 2. IF NO VARIANT CODE, TRY SKU
        // ============================================================

        if (!existingVariant && variant.skuCode) {
          existingVariant = existingVariants.find(
            (oldVariant) =>
              oldVariant.skuCode === variant.skuCode
          );
        }

        // ============================================================
        // 3. IF NO SKU, TRY BARCODE
        // ============================================================

        if (!existingVariant && variant.barcode) {
          existingVariant = existingVariants.find(
            (oldVariant) =>
              oldVariant.barcode === variant.barcode
          );
        }

        // ============================================================
        // 4. VARIANT CODE
        // ============================================================

        const variantCode =
          variant.variantCode ||
          existingVariant?.variantCode ||
          generateVariantCode();

        // ============================================================
        // 5. SKU
        // ============================================================

        let skuCode =
          variant.skuCode ||
          existingVariant?.skuCode;

        if (!skuCode) {
          skuCode = await generateSKU(
            "garments",
            productName,
            variant.color,
            variant.size
          );
        }

        // ============================================================
        // 6. BARCODE
        // ============================================================

        const barcode =
          variant.barcode ||
          existingVariant?.barcode ||
          generateBarcode();

        // ============================================================
        // 7. CURRENT STOCK
        // ============================================================

        let currentStock;

        if (existingVariant) {
          currentStock =
            variant.currentStock !== undefined
              ? Number(variant.currentStock)
              : Number(existingVariant.currentStock || 0);
        } else {
          currentStock =
            variant.currentStock !== undefined
              ? Number(variant.currentStock)
              : 0;
        }

        // ============================================================
        // 8. MINIMUM STOCK
        // ============================================================

        const minimumStock =
          variant.minimumStock !== undefined
            ? Number(variant.minimumStock)
            : Number(existingVariant?.minimumStock || 0);

            // check discount type and value
        const discountType =
          variant.discountType !== undefined
            ? variant.discountType
            : existingVariant?.discountType || "percentage";

            if(discountType === "percentage" && (variant.discountPercentage < 0 || variant.discountPercentage > 100)) {
              throw new Error("Invalid discount percentage. Please enter a value between 0 and 100.");
            }

        const discountValue =
          discountType == "percentage"
            ? Number(variant.discountPercentage || existingVariant?.discountPercentage || 0)
            : Number(variant?.discountAmount || 0);

        // ============================================================
        // 9. CREATE UPDATED VARIANT
        // ============================================================

        finalVariants.push({
          ...(existingVariant
            ? existingVariant.toObject
              ? existingVariant.toObject()
              : existingVariant
            : {}),

          ...variant,

          variantCode,
          skuCode,
          barcode,
          currentStock,
          minimumStock,
          discountType,
          discountValue,
        });
      }
console.log("updateDfinalVariantsata.variants", finalVariants);
      updateData.variants = finalVariants;
    }

    console.log("updateData.variants", updateData.variants);
    // ============================================================
    // SAVE UPLOADED PRODUCT IMAGE
    // ============================================================

    if (req.file) {
      updateData.image = req.file.filename;
    }

    // ============================================================
    // REMOVE UNWANTED FIELDS
    // ============================================================

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // ============================================================
    // UPDATE PRODUCT
    // ============================================================

    const updatedProduct =
      await GarmentProduct.findByIdAndUpdate(
        productId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("category")
        .populate("brand");

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      data: updatedProduct,
    });

  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Product
|--------------------------------------------------------------------------
*/

exports.deleteProduct = async (req, res) => {
  try {
    const product = await GarmentProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product Not Found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,

      message: "Product Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Product Stock Summary
|--------------------------------------------------------------------------
*/

exports.stockSummary = async (req, res) => {
  try {
    const products = await GarmentProduct.find();

    let totalStock = 0;

    products.forEach((product) => {
      product.variants.forEach((v) => {
        totalStock += v.currentStock || 0;
      });
    });

    res.status(200).json({
      success: true,

      totalProducts: products.length,

      totalStock,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
