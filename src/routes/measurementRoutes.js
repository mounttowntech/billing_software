const express = require("express");
const router = express.Router();

const {
createMeasurement,
getMeasurements,
getMeasurementById,
updateMeasurement,
deleteMeasurement
} = require(
"../controllers/measurementController"
);

router.post("/create",createMeasurement);
router.get("/all",getMeasurements);
router.get("/:id",getMeasurementById);
router.put("/update/:id",updateMeasurement);
router.delete("/delete/:id",deleteMeasurement);

module.exports = router;