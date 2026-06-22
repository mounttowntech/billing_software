// StockAdjustment production schema
const mongoose = require("mongoose");

const stockAdjustmentSchema =
new mongoose.Schema({

    adjustmentNo:{
        type:String,
        unique:true
    },

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GarmentProduct"
    },

    skuCode:String,

    adjustmentType:{
        type:String,
        enum:[
            "increase",
            "decrease"
        ]
    },

    quantity:Number,

    reason:String

},{
    timestamps:true,
    versionKey:false
});

module.exports =
mongoose.model(
"StockAdjustment",
stockAdjustmentSchema
);