const GarmentBrand =
require("../model/GarmentBrand");

exports.createBrand = async (req, res) => {
    try {

        const {
            brandCode,
            brandName,
            logo,
            description
        } = req.body;

        const existingBrand =
            await GarmentBrand.findOne({
                $or: [
                    { brandCode },
                    { brandName }
                ]
            });

        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: "Brand already exists"
            });
        }

        const brand =
            await GarmentBrand.create({
                brandCode,
                brandName,
                logo,
                description
            });

        res.status(201).json({
            success: true,
            data: brand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getBrands = async (req, res) => {
    try {

        const search =
            req.query.search || "";

        const brands =
            await GarmentBrand.find({
                brandName: {
                    $regex: search,
                    $options: "i"
                }
            });

        res.json({
            success: true,
            count: brands.length,
            data: brands
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getBrandById = async (req, res) => {
    try {

        const brand =
            await GarmentBrand.findById(
                req.params.id
            );

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        res.json({
            success: true,
            data: brand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateBrand = async (req, res) => {
    try {

        const brand =
            await GarmentBrand.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        res.json({
            success: true,
            data: brand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteBrand = async (req, res) => {
    try {

        await GarmentBrand.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true,
            message: "Brand deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};