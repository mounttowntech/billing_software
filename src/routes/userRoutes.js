const express = require("express");
const router = express.Router();

const {
  register,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  login,
  forgotPassword,
  verifyOTP,
  changePassword,
} = require("../controllers/userController");

router.post("/register", register);

router.get("/all", getUsers);

router.get("/:id", getUserById);

router.put("/update/:id", updateUser);

router.delete("/delete/:id", deleteUser);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOTP);

router.post("/change-password", changePassword);

module.exports = router;
