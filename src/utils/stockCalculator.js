const stockCalculation = (
    currentStock,
    quantity,
    operation
) => {

    let newStock =
        currentStock;

    switch(operation){

        case "purchase":
            newStock =
                currentStock +
                quantity;
            break;

        case "sale":
            newStock =
                currentStock -
                quantity;
            break;

        case "sales_return":
            newStock =
                currentStock +
                quantity;
            break;

        case "purchase_return":
            newStock =
                currentStock -
                quantity;
            break;

        case "adjustment_in":
            newStock =
                currentStock +
                quantity;
            break;

        case "adjustment_out":
            newStock =
                currentStock -
                quantity;
            break;

        default:
            throw new Error(
                "Invalid Stock Operation"
            );
    }

    if(newStock < 0){
        throw new Error(
            "Insufficient Stock"
        );
    }

    return {
        beforeStock:
            currentStock,
        quantity,
        afterStock:
            newStock
    };
};

module.exports =
stockCalculation;