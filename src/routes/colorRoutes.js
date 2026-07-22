const express = require("express");
const router = express.Router();

const {
  createColor,
  getColors,
  getColorById,
  updateColor,
  deleteColor,
} = require("../controllers/colorController");

router.post("/create", createColor);

router.get("/all", getColors);

router.get("/:id", getColorById);

router.put("/update/:id", updateColor);

router.delete("/delete/:id", deleteColor);

module.exports = router;
