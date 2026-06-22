// Payment production schema
const mongoose = require("mongoose");

const paymentSchema =
new mongoose.Schema({

    paymentNo:{
        type:String,
        unique:true
    },

    type:{
        type:String,
        enum:[
            "sale",
            "purchase",
            "refund"
        ]
    },

    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GarmentCustomer"
    },

    amount:{
        type:Number,
        required:true
    },

    paymentMethod:{
        type:String,
        enum:[
            "cash",
            "upi",
            "card",
            "wallet",
            "bank"
        ]
    },

    paymentDate:{
        type:Date,
        default:Date.now
    },

    remarks:String

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"Payment",
paymentSchema
);