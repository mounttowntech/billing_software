const stockCalculation = (currentStock, quantity, operation) => {

    currentStock = Number(currentStock);
    quantity = Number(quantity);

    let newStock = currentStock;

    switch (operation) {

        case "purchase":
            newStock = currentStock + quantity;
            break;

        case "sale":
            if (currentStock < quantity) {
                throw new Error("Insufficient Stock");
            }
            newStock = currentStock - quantity;
            break;

        case "sales_return":
            newStock = currentStock + quantity;
            break;

        case "purchase_return":
            if (currentStock < quantity) {
                throw new Error("Insufficient Stock");
            }
            newStock = currentStock - quantity;
            break;

        case "adjustment_in":
            newStock = currentStock + quantity;
            break;

        case "adjustment_out":
            if (currentStock < quantity) {
                throw new Error("Insufficient Stock");
            }
            newStock = currentStock - quantity;
            break;

        default:
            throw new Error("Invalid Stock Operation");
    }

    return {
        beforeStock: currentStock,
        afterStock: newStock
    };
};

module.exports = stockCalculation;