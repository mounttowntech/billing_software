const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.post("/create", createCategory);

router.get("/all", getCategories);

router.get("/:id", getCategoryById);

router.put("/update/:id", updateCategory);

router.delete("/delete/:id", deleteCategory);

module.exports = router;
