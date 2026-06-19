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

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/products", require("./src/routes/productRoutes"));
app.use("/api/variants", require("./src/routes/productVariantRoutes"));
app.use("/api/categories", require("./src/routes/categoryRoutes"));
app.use("/api/brands", require("./src/routes/brandRoutes"));
app.use("/api/customers", require("./src/routes/customerRoutes"));
app.use("/api/suppliers", require("./src/routes/supplierRoutes"));
app.use("/api/purchases", require("./src/routes/purchaseRoutes"));
app.use("/api/invoices", require("./src/routes/invoiceRoutes"));
app.use("/api/sales-returns", require("./src/routes/salesReturnRoutes"));

app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/stock", require("./src/routes/stockRoutes"));
app.use("/api/expenses", require("./src/routes/expenseRoutes"));
// app.use("/api/dashboard", require("./src/routes/"));
app.use("/api/reports", require("./src/routes/reportRoutes"));
app.use("/api/restaurant", require("./src/routes/restaurantRoutes"));
app.use("/api/categories", require("./src/routes/categoryRoutes"));
app.use("/api/brands", require("./src/routes/brandRoutes"));
app.use("/api/industries", require("./src/routes/industryRoutes"));
app.use("/api/units", require("./src/routes/unitRoutes"));
app.use("/api/stores", require("./src/routes/storeRoutes"));
app.use("/api/role-permissions", require("./src/routes/rolePermissionRoutes"));
app.use("/api/customer-addresses", require("./src/routes/customerAddressRoutes"));
app.use("/api/purchase-returns", require("./src/routes/purchaseReturnRoutes"));
app.use("/api/stock-adjustments", require("./src/routes/stockAdjustmentRoutes"));
app.use("/api/tax-settings", require("./src/routes/taxSettingRoutes"));
app.use("/api/audit-logs", require("./src/routes/auditLogRoutes"));

app.use(errorMiddleware);

module.exports = app;