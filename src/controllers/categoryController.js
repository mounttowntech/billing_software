const GarmentCategory = require("../model/GarmentCategory")


exports.createCategory = async (req, res) => {
    try {

        const {
            categoryCode,
            categoryName,
            description,
            image
        } = req.body;

        const existingCategory =
            await GarmentCategory.findOne({
                $or: [
                    { categoryCode },
                    { categoryName }
                ]
            });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message:
                    "Category already exists"
            });
        }

        const category =
            await GarmentCategory.create({
                categoryCode,
                categoryName,
                description,
                image
            });

        res.status(201).json({
            success: true,
            message:
                "Category created successfully",
            data: category
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


exports.getCategories = async (req, res) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 10;

        const skip =
            (page - 1) * limit;

        const search =
            req.query.search || "";

        const query = {

            categoryName: {
                $regex: search,
                $options: "i"
            }

        };

        const total =
            await GarmentCategory.countDocuments(
                query
            );

        const categories =
            await GarmentCategory.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            limit,
            data: categories
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.getCategoryById =
async (req, res) => {

    try {

        const category =
            await GarmentCategory.findById(
                req.params.id
            );

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.updateCategory =
async (req, res) => {

    try {

        const category =
            await GarmentCategory.findById(
                req.params.id
            );

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    "Category not found"
            });
        }

        const duplicate =
            await GarmentCategory.findOne({
                categoryName:
                    req.body.categoryName,
                _id: {
                    $ne: req.params.id
                }
            });

        if (duplicate) {
            return res.status(400).json({
                success: false,
                message:
                    "Category name already exists"
            });
        }

        const updatedCategory =
            await GarmentCategory.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        res.status(200).json({
            success: true,
            message:
                "Category updated successfully",
            data: updatedCategory
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


exports.deleteCategory =
async (req, res) => {

    try {

        const category =
            await GarmentCategory.findById(
                req.params.id
            );

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    "Category not found"
            });
        }

        await GarmentCategory.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Category deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};