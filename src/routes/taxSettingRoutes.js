const express = require("express");
const router = express.Router();

const {
    createTax,
    getTaxes,
    getTaxById,
    updateTax,
    deleteTax
} = require("../controllers/taxSettingController");

router.post("/create", createTax);

router.get("/all", getTaxes);

router.get("/:id", getTaxById);

router.put("/update/:id", updateTax);

router.delete("/delete/:id", deleteTax);

module.exports = router;