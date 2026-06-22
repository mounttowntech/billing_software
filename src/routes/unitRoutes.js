const express = require("express");
const router = express.Router();

const {
    createUnit,
    getUnits,
    getUnitById,
    updateUnit,
    deleteUnit
} = require("../controllers/unitController");

router.post("/create", createUnit);

router.get("/all", getUnits);

router.get("/:id", getUnitById);

router.put("/update/:id", updateUnit);

router.delete("/delete/:id", deleteUnit);

module.exports = router;