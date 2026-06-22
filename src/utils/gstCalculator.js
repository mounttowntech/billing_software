const calculateGST = (
    amount,
    gstPercentage
) => {

    const gstAmount =
        (amount * gstPercentage) / 100;

    const totalAmount =
        amount + gstAmount;

    return {
        amount,
        gstPercentage,
        gstAmount,
        totalAmount
    };

};

module.exports =
calculateGST;