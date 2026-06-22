const express = require("express");
const router = express.Router();

const {
createCustomer,
getCustomers,
getCustomerById,
updateCustomer,
deleteCustomer
} = require(
"../controllers/customerController"
);

router.post("/create",createCustomer);
router.get("/all",getCustomers);
router.get("/:id",getCustomerById);
router.put("/update/:id",updateCustomer);
router.delete("/delete/:id",deleteCustomer);

module.exports = router;