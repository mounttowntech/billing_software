const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
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
  resetPassword
} = require("../controllers/userController");

router.post("/register", register);

router.get("/all", getUsers);

router.get("/:id", getUserById);

router.put("/update/:id", updateUser);

router.delete("/delete/:id", deleteUser);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOTP);
router.post(
  "/reset-password",
  resetPassword
);

router.post("/change-password", verifyToken, changePassword);

module.exports = router;
