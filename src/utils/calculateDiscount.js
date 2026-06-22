const calculateDiscount = (
    amount,
    discountPercentage
) => {

    const discountAmount =
        (amount *
        discountPercentage) / 100;

    const finalAmount =
        amount - discountAmount;

    return {
        amount,
        discountPercentage,
        discountAmount,
        finalAmount
    };

};

module.exports =
calculateDiscount;