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

    supplier:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Supplier"
},

invoice:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Invoice"
},

purchase:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Purchase"
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
            "net_banking",
            "cheque"
        ]
    },

    paymentDate:{
        type:Date,
        default:Date.now
    },

    remarks:String,

    paymentStatus:{
        type:String,
        enum:[
            "pending",
            "completed",
            "failed"
        ],
        default:"pending"
    }

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"Payment",
paymentSchema
);