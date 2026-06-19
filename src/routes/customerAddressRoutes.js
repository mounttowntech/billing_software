const router = require("express").Router();
const c = require("../controllers/customerAddressController");

router.post("/create", c.createCustomerAddress);
router.get("/all", c.getCustomerAddresss);
router.get("/:id", c.getCustomerAddressById);
router.put("/:id", c.updateCustomerAddress);
router.delete("/:id", c.deleteCustomerAddress);

module.exports = router;
