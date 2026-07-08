const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
{
    supplierCode: {
        type: String,
        unique: true,
        required: true
    },

    supplierName: {
        type: String,
        required: true,
        trim: true
    },

    contactPerson: {
        type: String,
        trim: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String
    },

    gstNumber: {
        type: String
    },

    address: {
        type: String
    },

    city: {
        type: String
    },

    state: {
        type: String
    },

    pincode: {
        type: String
    },

    openingBalance: {
        type: Number,
        default: 0
    },

    currentBalance: {
        type: Number,
        default: 0
    },

    status: {
        type: Boolean,
        default: true
    }

},
{
    timestamps:true
}
);

module.exports =
mongoose.model(
    "Supplier",
    supplierSchema
);