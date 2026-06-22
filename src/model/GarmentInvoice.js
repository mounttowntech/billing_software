// GarmentInvoice production schema
const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GarmentProduct",
        required:true
    },

    skuCode:String,

    barcode:String,

    productName:String,

    size:String,

    color:String,

    quantity:{
        type:Number,
        required:true
    },

    price:{
        type:Number,
        required:true
    },

    discount:{
        type:Number,
        default:0
    },

    gstPercentage:{
        type:Number,
        default:5
    },

    gstAmount:Number,

    totalAmount:Number

},{_id:false});

const garmentInvoiceSchema =
new mongoose.Schema({

    invoiceNo:{
        type:String,
        unique:true,
        required:true
    },

    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GarmentCustomer"
    },

    invoiceDate:{
        type:Date,
        default:Date.now
    },

    items:[invoiceItemSchema],

    subTotal:Number,

    discountAmount:{
        type:Number,
        default:0
    },

    gstAmount:Number,

    grandTotal:Number,

    paidAmount:{
        type:Number,
        default:0
    },

    returnAmount:{
        type:Number,
        default:0
    },

    dueAmount:{
        type:Number,
        default:0
    },

    paymentMethod:{
        type:String,
        enum:[
            "cash",
            "upi",
            "card",
            "wallet",
            "credit"
        ]
    },

    paymentStatus:{
        type:String,
        enum:[
            "paid",
            "partial",
            "pending"
        ],
        default:"pending"
    },

    remarks:String

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"GarmentInvoice",
garmentInvoiceSchema
);