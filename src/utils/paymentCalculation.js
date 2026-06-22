const paymentCalculation = (
    grandTotal,
    paidAmount
) => {

    const balanceAmount =
        Math.max(
            grandTotal - paidAmount,
            0
        );

    const returnAmount =
        Math.max(
            paidAmount - grandTotal,
            0
        );

    let paymentStatus =
        "pending";

    if(
        paidAmount >= grandTotal
    ){
        paymentStatus = "paid";
    }
    else if(
        paidAmount > 0
    ){
        paymentStatus = "partial";
    }

    return {
        grandTotal,
        paidAmount,
        balanceAmount,
        returnAmount,
        paymentStatus
    };

};

module.exports =
paymentCalculation;