const successResponse = (req, res, data, message, code = 200) => {
   return res.send({
        code,
        message,
        data,
        success: true
    })
}

const errorResponse = (req, res, errorMessage = 'something went wrong', code = 500, error={}) => {
   return res.send({
        code,
        errorMessage,
        error,
        data: null,
        success: false
    });
}

module.exports = {
    successResponse,
    errorResponse
}