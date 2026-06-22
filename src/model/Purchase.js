// Purchase production schema
const mongoose = require("mongoose");

const purchaseItemSchema =
new mongoose.Schema({

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GarmentProduct"
    },

    skuCode:String,

    quantity:Number,

    purchasePrice:Number,

    gstPercentage:Number,

    gstAmount:Number,

    totalAmount:Number

},{_id:false});

const purchaseSchema =
new mongoose.Schema({

    purchaseNo:{
        type:String,
        unique:true
    },

    supplier:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Supplier"
    },

    purchaseDate:{
        type:Date,
        default:Date.now
    },

    items:[purchaseItemSchema],

    subTotal:Number,

    gstAmount:Number,

    grandTotal:Number,

    paidAmount:Number,

    dueAmount:Number,

    paymentStatus:{
        type:String,
        enum:[
            "paid",
            "partial",
            "unpaid"
        ]
    }

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"Purchase",
purchaseSchema
);