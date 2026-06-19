const router = require("express").Router();
const c = require("../controllers/categoryController.js");

router.post("/create", c.createCategory);
router.get("/all", c.getCategorys);
router.get("/:id", c.getCategoryById);
router.put("/:id", c.updateCategory);
router.delete("/:id", c.deleteCategory);

module.exports = router;
