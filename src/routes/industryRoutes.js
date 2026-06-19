const router = require("express").Router();
const c = require("../controllers/industryController.js");

router.post("/create", c.createIndustry);
router.get("/all", c.getIndustrys);
router.get("/:id", c.getIndustryById);
router.put("/:id", c.updateIndustry);
router.delete("/:id", c.deleteIndustry);

module.exports = router;
