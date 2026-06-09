const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
// ✅ Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) =>
  res.json({ success: true, message: "Billing Software Complete Workflow API working" }),
);

module.exports = app;
