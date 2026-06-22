const express = require("express");
const router = express.Router();

const {
createAddress,
getAddresses,
getAddressById,
updateAddress,
deleteAddress
} = require(
"../controllers/customerAddressController"
);

router.post("/create",createAddress);
router.get("/all",getAddresses);
router.get("/:id",getAddressById);
router.put("/update/:id",updateAddress);
router.delete("/delete/:id",deleteAddress);

module.exports = router;