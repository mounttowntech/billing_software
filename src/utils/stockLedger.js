const StockLedger =
require("../model/StockLedger");

const createStockLedger =
async ({
    product,
    skuCode,
    movementType,
    quantity,
    beforeStock,
    afterStock,
    referenceNumber,
    remarks
}) => {

    await StockLedger.create({

        product,

        skuCode,

        movementType,

        quantity,

        beforeStock,

        afterStock,

        referenceNumber,

        remarks

    });

};

module.exports =
createStockLedger;