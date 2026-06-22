const express = require("express");
const router = express.Router();

const {
createExpense,
getExpenses,
getExpenseById,
updateExpense,
deleteExpense
} = require(
"../controllers/expenseController"
);

router.post("/create",createExpense);
router.get("/all",getExpenses);
router.get("/:id",getExpenseById);
router.put("/update/:id",updateExpense);
router.delete("/delete/:id",deleteExpense);

module.exports = router;