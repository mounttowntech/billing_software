const Purchase =
require("../model/Purchase");

const generatePurchaseNo =
async () => {

    const count =
        await Purchase.countDocuments();

    return `PUR-${String(
        count + 1
    ).padStart(6,"0")}`;

};

module.exports =
generatePurchaseNo;