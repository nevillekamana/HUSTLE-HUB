//-----------------------------------------------------\\
//                     STATUS CODES
//-----------------------------------------------------\\

//the codes this api replies with, named so a handler reads as its intent
//instead of as a number, and so the set stays the one the spec fixes
//frozen because a status code is a constant, not something a caller may reassign
const HTTP_STATUS = Object.freeze({
  //the request was understood and answered
  OK: 200,
  //registration created a user
  CREATED: 201,
  //a malformed body, or a field that failed validation
  BAD_REQUEST: 400,
  //the credentials were wrong, or the token is missing or invalid
  UNAUTHORIZED: 401,
  //the caller is known but the role does not permit this
  FORBIDDEN: 403,
  //an unknown route, or a resource that does not exist
  NOT_FOUND: 404,
  //the email is already registered
  CONFLICT: 409,
  //the request body went past the parser limit
  PAYLOAD_TOO_LARGE: 413,
  //too many attempts from one client in the rate limit window
  TOO_MANY_REQUESTS: 429,
  //something failed that the caller cannot fix, never explained in detail
  INTERNAL_SERVER_ERROR: 500
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

//exported as the object itself so a handler reads httpStatus.CREATED
module.exports = HTTP_STATUS;
