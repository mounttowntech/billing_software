const express = require("express");
const router = express.Router();

const {
  createSize,
  getSizes,
  getSizeById,
  updateSize,
  deleteSize,
} = require("../controllers/sizeController");

router.post("/create", createSize);

router.get("/all", getSizes);

router.get("/:id", getSizeById);

router.put("/update/:id", updateSize);

router.delete("/delete/:id", deleteSize);

module.exports = router;
