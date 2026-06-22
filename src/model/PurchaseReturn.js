// PurchaseReturn production schema
const mongoose = require("mongoose");

const purchaseReturnSchema =
new mongoose.Schema({

    returnNo:{
        type:String,
        unique:true
    },

    purchase:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Purchase"
    },

    supplier:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Supplier"
    },

    returnDate:{
        type:Date,
        default:Date.now
    },

    refundAmount:Number,

    reason:String

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"PurchaseReturn",
purchaseReturnSchema
);