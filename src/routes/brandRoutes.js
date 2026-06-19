const router = require("express").Router();
const c = require("../controllers/brandController.js");

router.post("/create", c.createBrand);
router.get("/all", c.getBrands);
router.get("/:id", c.getBrandById);
router.put("/:id", c.updateBrand);
router.delete("/:id", c.deleteBrand);

module.exports = router;
