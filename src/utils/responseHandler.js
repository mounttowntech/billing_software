exports.successResponse = (
    res,
    message,
    data = null
) => {

    return res.status(200).json({
        success:true,
        message,
        data
    });

};

exports.errorResponse = (
    res,
    message,
    status = 500
) => {

    return res.status(status).json({
        success:false,
        message
    });

};