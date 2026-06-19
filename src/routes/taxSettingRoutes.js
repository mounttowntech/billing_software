const router = require("express").Router();
const c = require("../controllers/taxSettingController");

router.post("/", c.createTaxSetting);
router.get("/", c.getTaxSettings);
router.get("/:id", c.getTaxSettingById);
router.put("/:id", c.updateTaxSetting);
router.delete("/:id", c.deleteTaxSetting);

module.exports = router;
