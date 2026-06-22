const express = require("express");
const router = express.Router();

const {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
} = require("../controllers/storeController");

router.post("/create", createStore);
router.get("/all", getStores);
router.get("/:id", getStoreById);
router.put("/update/:id", updateStore);
router.delete("/delete/:id", deleteStore);

module.exports = router;
