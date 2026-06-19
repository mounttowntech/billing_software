const express = require("express");
const {
  createExpense,
  getExpenses,
  deleteExpense,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();



router.post("/create", allowRoles("superadmin", "owner", "accountant"), createExpense);
router.get("/all", allowRoles("superadmin", "owner", "accountant"), getExpenses);
router.delete("/:id", allowRoles("superadmin", "owner"), deleteExpense);

module.exports = router;