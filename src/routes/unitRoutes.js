const router = require("express").Router();
const c = require("../controllers/unitController");

router.post("/", c.createUnit);
router.get("/", c.getUnits);
router.get("/:id", c.getUnitById);
router.put("/:id", c.updateUnit);
router.delete("/:id", c.deleteUnit);

module.exports = router;
