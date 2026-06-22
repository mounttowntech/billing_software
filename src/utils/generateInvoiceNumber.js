const GarmentInvoice =
require("../model/GarmentInvoice");

const generateInvoiceNo =
async () => {

    const count =
        await GarmentInvoice.countDocuments();

    return `INV-${String(
        count + 1
    ).padStart(6,"0")}`;

};

module.exports =
generateInvoiceNo;