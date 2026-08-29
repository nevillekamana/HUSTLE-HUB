//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');

//-----------------------------------------------------\\
//                   NOT FOUND HANDLER
//-----------------------------------------------------\\

//mounted after every route, so express only reaches it when nothing matched
//it answers here rather than passing the case along, which keeps the 404 shape
//fixed even as role 2 changes the error handler that sits behind it
//the path that was asked for is deliberately not echoed back, a 404 that
//repeats the request hands a caller a way to reflect their own input
const notFound = (req, res) =>
  sendFailure(res, httpStatus.NOT_FOUND, 'the requested route does not exist');

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = notFound;
