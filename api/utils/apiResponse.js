//-----------------------------------------------------\\
//                   SUCCESS RESPONSES
//-----------------------------------------------------\\

//every successful response leaves through here so the envelope is identical on
//every endpoint, data defaults to an empty object rather than being left out so
//a client can read response.data without checking that it exists first
const sendSuccess = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({
    success: true,
    message,
    data
  });

//-----------------------------------------------------\\
//                   FAILURE RESPONSES
//-----------------------------------------------------\\

//the failure twin, errors carries the per field validation detail and stays an
//empty array when there is nothing field specific to report
//message is written for whoever is calling the api, an exception message, a
//file path or an environment value must never be handed to this function
const sendFailure = (res, statusCode, message, errors = []) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  sendSuccess,
  sendFailure
};
