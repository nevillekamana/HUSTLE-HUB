//-----------------------------------------------------\\
//                    SEAM — ROLE 2 OWNS THIS
//-----------------------------------------------------\\
//role 1 defines the interface only, role 2 implements the internals

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const logger = require('../utils/logger');

//-----------------------------------------------------\\
//                     ERROR HANDLER
//-----------------------------------------------------\\

//what the caller is told, keyed by the error type express sets rather than
//taken from error.message, which can carry a file path or a rejected value
const SAFE_MESSAGES = Object.freeze({
  'entity.parse.failed': 'the request body is not valid json',
  'entity.too.large': 'the request body is too large',
  fallback: 'an unexpected error occurred'
});

//an error the framework tagged with a status is reported with it, anything
//arriving without one is unexpected and is always reported as a 500
const resolveStatus = (error) => {
  const status = Number(error.status || error.statusCode);

  return Number.isInteger(status) && status >= 400 && status <= 599
    ? status
    : httpStatus.INTERNAL_SERVER_ERROR;
};

//four parameters, express only treats a function as an error handler at this
//arity, next must stay in the signature even where it is not called
//role 2 extends the message table and the logging here, the contract this
//keeps is that nothing derived from the error object reaches the response
const errorHandler = (error, req, res, next) => {
  //a failure part way through a reply cannot be reformatted, express closes it
  if (res.headersSent) {
    return next(error);
  }

  const status = resolveStatus(error);

  //the whole error goes to the server log where it can be read during marking,
  //the caller receives only the fixed message chosen below
  logger[status >= 500 ? 'error' : 'warn']('error.handled', { requestId: req.id, method: req.method, path: req.originalUrl, status, error });

  return sendFailure(res, status, SAFE_MESSAGES[error.type] || SAFE_MESSAGES.fallback);
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = errorHandler;
