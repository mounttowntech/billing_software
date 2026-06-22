const express = require("express");
const router = express.Router();

const {
    createFabric,
    getFabrics,
    getFabricById,
    updateFabric,
    deleteFabric
} = require("../controllers/fabricController");

router.post("/create", createFabric);

router.get("/all", getFabrics);

router.get("/:id", getFabricById);

router.put("/update/:id", updateFabric);

router.delete("/delete/:id", deleteFabric);

module.exports = router;