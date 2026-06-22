const express = require("express");
const cors = require("cors");
const path = require("path");
const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Billing API running" });
});

app.use(errorMiddleware);
app.use("/api/alteration", require("./src/routes/alterationRoutes"));
app.use("/api/brands", require("./src/routes/brandRoutes"));
app.use("/api/category", require("./src/routes/categoryRoutes"));
app.use("/api/color", require("./src/routes/colorRoutes"));
app.use("/api/fabric", require("./src/routes/fabricRoutes"));
app.use("/api/season", require("./src/routes/seasonRoutes"));
app.use("/api/size", require("./src/routes/sizeRoutes"));
app.use("/api/style", require("./src/routes/styleRoutes"));
app.use("/api/tax", require("./src/routes/taxsettingRoutes"));
app.use("/api/unit", require("./src/routes/unitRoutes"));
app.use("/api/customerdetails", require("./src/routes/customerAddressRoutes"));
app.use("/api/customers", require("./src/routes/customerRoutes"));
app.use("/api/invoice", require("./src/routes/invoiceRoutes"));
app.use("/api/product", require("./src/routes/productRoutes"));
app.use("/api/purchase", require("./src/routes/purchaseRoutes"));
app.use("/api/purchasereturn", require("./src/routes/purchaseReturnRoutes"));
app.use("/api/salesreturn", require("./src/routes/salesReturnRoutes"));
app.use("/api/stock-adjustments",require("./src/routes/stockadjustmentRoutes"));
app.use("/api/stock-ledgers", require("./src/routes/stockledgerRoutes"));
app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/expenses", require("./src/routes/expenseRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/roles", require("./src/routes/rolePermissionRoutes"));
app.use("/api/stores", require("./src/routes/storeRoutes"));
app.use("/api/auditlogs", require("./src/routes/auditLogRoutes"));
app.use("/api/measurements", require("./src/routes/measurementRoutes"));

module.exports = app;
