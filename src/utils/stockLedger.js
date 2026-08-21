const StockLedger = require("../model/StockLedger");

const createStockLedger =
async ({
    product,
    skuCode,
    movementType,
    quantity,
    beforeStock,
    afterStock,
    referenceNumber,
    remarks,
    industryType
}) => {

    await StockLedger.create({

        product,

        skuCode,

        movementType,

        quantity,

        beforeStock,

        afterStock,

        referenceNumber,

        remarks,

        industryType: industryType || "garments",

    });

};

module.exports =
createStockLedger;