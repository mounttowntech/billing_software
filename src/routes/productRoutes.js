const router = require("express").Router();
const controller = require("../controllers/productController");

router.post("/create", controller.createProduct);
router.get("/all", controller.getProducts);
router.get("/:id", controller.getProductById);
router.put("/:id", controller.updateProduct);

module.exports = router;