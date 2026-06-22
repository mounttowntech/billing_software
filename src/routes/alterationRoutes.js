const express = require("express");
const router = express.Router();

const {
createAlteration,
getAlterations,
getAlterationById,
updateAlteration,
deleteAlteration
} = require(
"../controllers/alterationController"
);

router.post("/create",createAlteration);
router.get("/all",getAlterations);
router.get("/:id",getAlterationById);
router.put("/update/:id",updateAlteration);
router.delete("/delete/:id",deleteAlteration);

module.exports = router;