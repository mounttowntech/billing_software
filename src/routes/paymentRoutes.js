const express = require("express");
const router = express.Router();

const {
createPayment,
getPayments,
getPaymentById,
updatePayment,
deletePayment
} = require(
"../controllers/paymentController"
);

router.post("/create",createPayment);
router.get("/all",getPayments);
router.get("/:id",getPaymentById);
router.put("/update/:id",updatePayment);
router.delete("/delete/:id",deletePayment);

module.exports = router;