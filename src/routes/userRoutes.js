const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  verifyOTP,
  changePassword,
} = require("../controllers/userController");

router.post("/create", createUser);

router.get("/all", getUsers);

router.get("/:id", getUserById);

router.put("/update/:id", updateUser);

router.delete("/delete/:id", deleteUser);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOTP);

router.post("/change-password", changePassword);

module.exports = router;
