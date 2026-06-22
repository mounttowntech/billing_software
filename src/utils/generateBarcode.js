const crypto = require("crypto");

const generateBarcode = () => {

    const timestamp =
        Date.now().toString();

    const random =
        crypto
        .randomInt(100,999)
        .toString();

    return (
        timestamp.slice(-10) +
        random
    );
};

module.exports =
generateBarcode;