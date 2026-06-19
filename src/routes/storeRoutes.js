const router = require("express").Router();
const c = require("../controllers/storeController");

router.post("/", c.createStore);
router.get("/", c.getStores);
router.get("/:id", c.getStoreById);
router.put("/:id", c.updateStore);
router.delete("/:id", c.deleteStore);

module.exports = router;
