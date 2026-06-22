const express = require("express");
const router = express.Router();

const {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand
} = require("../controllers/brandController");

router.post("/create", createBrand);

router.get("/all", getBrands);

router.get("/:id", getBrandById);

router.put("/update/:id", updateBrand);

router.delete("/delete/:id", deleteBrand);

module.exports = router;