// Expense production schema
const mongoose = require("mongoose");

const expenseSchema =
new mongoose.Schema({

    expenseNo:{
        type:String,
        unique:true
    },

    title:{
        type:String,
        required:true
    },

    category:{
        type:String,
        enum:[
            "rent",
            "salary",
            "electricity",
            "marketing",
            "transport",
            "miscellaneous"
        ]
    },

    amount:{
        type:Number,
        required:true
    },

    expenseDate:{
        type:Date,
        default:Date.now
    },

    note:String

},{
    timestamps:true
});

module.exports =
mongoose.model(
"Expense",
expenseSchema
);