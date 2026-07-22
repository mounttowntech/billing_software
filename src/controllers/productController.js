const GarmentProduct = require("../model/GarmentProduct");

const generateSKU = require("../utils/generateSKU");

const generateBarcode = require("../utils/generateBarcode");

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

      finalVariants.push({
        ...variant,

        skuCode,

        barcode,
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

exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Convert variants string to array
    if (updateData.variants && typeof updateData.variants === "string") {
      updateData.variants = JSON.parse(updateData.variants);
    }

    // Save uploaded image if a new one is selected
    if (req.file) {
      updateData.image = req.file.filename; // or req.file.path
    }

    const product = await GarmentProduct.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("category")
      .populate("brand");

    res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
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
