const express = require("express");
const router = express.Router();

const {
    createSeason,
    getSeasons,
    getSeasonById,
    updateSeason,
    deleteSeason
} = require("../controllers/seasonController");

router.post("/create", createSeason);

router.get("/all", getSeasons);

router.get("/:id", getSeasonById);

router.put("/update/:id", updateSeason);

router.delete("/delete/:id", deleteSeason);

module.exports = router;