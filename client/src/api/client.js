//-----------------------------------------------------\\
//                   MESSAGES AND LIMITS
//-----------------------------------------------------\\

//the only words a failed request can ever put on screen, the server's own
//message is shown only where it is written for people and safe to repeat
const MESSAGES = Object.freeze({
  sessionExpired: 'Your session has expired, please sign in again',
  forbidden: 'You don’t have permission to do that',
  notFound: 'Not found',
  generic: 'Something went wrong, please try again'
});

//a request that hangs is treated like a network failure rather than leaving a
//spinner on screen forever
const TIMEOUT_MS = 15000;

//-----------------------------------------------------\\
//                      API ERROR
//-----------------------------------------------------\\

//everything a page may show about a failure, status for branching, a safe
//message for a banner and field errors for the inputs they belong to
//it deliberately carries nothing else, so there is no raw body or stack for a
//component to render by mistake
class ApiError extends Error {
  constructor(status, message, fieldErrors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

//what a page shows for any caught error, an ApiError already holds a safe
//sentence, anything else is a fault on this side and only ever reads as the
//generic one, so a stray exception can never put its own text on screen
const messageFor = (error) => (error instanceof ApiError ? error.message : MESSAGES.generic);

//-----------------------------------------------------\\
//                   CLIENT SETTINGS
//-----------------------------------------------------\\

//the auth context plugs in here, which keeps this module free of react and
//lets a test drive it with a plain function
const settings = {
  getToken: () => null,
  onUnauthorized: () => {}
};

const configureApiClient = ({ getToken, onUnauthorized }) => {
  if (typeof getToken === 'function') {
    settings.getToken = getToken;
  }

  if (typeof onUnauthorized === 'function') {
    settings.onUnauthorized = onUnauthorized;
  }
};

//-----------------------------------------------------\\
//                  ENVELOPE HANDLING
//-----------------------------------------------------\\

//api messages are lowercase by convention, a capital first letter is all it
//takes to make one read as a sentence on screen
const toSentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

//only well formed { field, message } pairs survive, anything else in the
//array is dropped rather than rendered
const readFieldErrors = (errors) =>
  Array.isArray(errors)
    ? errors
        .filter((item) => item && typeof item.field === 'string' && typeof item.message === 'string')
        .map((item) => ({ field: item.field, message: item.message }))
    : [];

const readServerMessage = (envelope) =>
  envelope && typeof envelope.message === 'string' && envelope.message.trim() !== ''
    ? toSentence(envelope.message.trim())
    : null;

//maps a failed reply onto the fixed message set from the plan
//a 401 on a request that carried a token means the session died, a 401 on the
//login request itself is just a wrong password and keeps the server's wording
const toApiError = (status, envelope, sentToken) => {
  const serverMessage = readServerMessage(envelope);
  const fieldErrors = readFieldErrors(envelope && envelope.errors);

  if (status === 401 && sentToken) {
    return new ApiError(401, MESSAGES.sessionExpired);
  }

  if (status === 403) {
    return new ApiError(403, MESSAGES.forbidden);
  }

  if (status === 404) {
    return new ApiError(404, MESSAGES.notFound);
  }

  //400, 401 without a token, 409 and 429 carry messages written for the user
  if (status >= 400 && status < 500 && serverMessage) {
    return new ApiError(status, serverMessage, fieldErrors);
  }

  return new ApiError(status, MESSAGES.generic);
};

//a proxy error page or an empty body is not json, it becomes a generic
//failure rather than an exception with markup inside it
const readEnvelope = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

//-----------------------------------------------------\\
//                      TRANSPORTS
//-----------------------------------------------------\\

//the real network, always a relative /api path so the dev proxy and the same
//origin production build both work unchanged
const fetchTransport = async ({ method, path, body, token }) => {
  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('/api' + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });

    return { status: response.status, envelope: await readEnvelope(response) };
  } finally {
    clearTimeout(timer);
  }
};

//-----------------------------------------------------\\
//                       REQUEST
//-----------------------------------------------------\\

//sends one request and resolves with the data object, or throws an ApiError
//a transport can be swapped in, which is how the mock layer answers routes
//the backend has not built yet through exactly the same error mapping
const request = async (method, path, { body, transport = fetchTransport } = {}) => {
  const token = settings.getToken();
  let reply;

  try {
    reply = await transport({ method, path, body, token });
  } catch {
    //offline, refused, aborted by the timeout, all read the same to a person
    throw new ApiError(0, MESSAGES.generic);
  }

  const { status, envelope } = reply;

  if (status >= 200 && status < 300 && envelope && envelope.success === true) {
    return envelope.data || {};
  }

  const error = toApiError(status, envelope, Boolean(token));

  if (error.status === 401 && token) {
    settings.onUnauthorized(error.message);
  }

  throw error;
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { ApiError, MESSAGES, configureApiClient, messageFor, request, toApiError };
