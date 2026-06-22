const express = require("express");
const router = express.Router();

const {
    createStyle,
    getStyles,
    getStyleById,
    updateStyle,
    deleteStyle
} = require("../controllers/styleController");

router.post("/create", createStyle);

router.get("/all", getStyles);

router.get("/:id", getStyleById);

router.put("/update/:id", updateStyle);

router.delete("/delete/:id", deleteStyle);

module.exports = router;