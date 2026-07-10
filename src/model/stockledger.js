// StockLedger production schema
const mongoose = require("mongoose");

const stockLedgerSchema =
new mongoose.Schema({

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GarmentProduct"
    },

    skuCode:String,

    movementType:{
        type:String,
        enum:[
            "purchase",
            "sale",
            "sales_return",
            "sale_cancel",
            "purchase_return",
            "adjustment_in",
            "adjustment_out"
        ]
    },

    quantity:Number,

    beforeStock:Number,

    afterStock:Number,

    referenceNumber:String,

    remarks:String

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"StockLedger",
stockLedgerSchema
);