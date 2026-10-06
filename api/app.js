//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const { sanitizeRequest } = require('./middleware/sanitizeMiddleware');
const requireAuthByDefault = require('./middleware/apiGuard');
const { apiRateLimiter } = require('./middleware/rateLimitMiddleware');

//-----------------------------------------------------\\
//                   APPLICATION SETUP
//-----------------------------------------------------\\

const app = express();

//trust the first proxy hop so client ips stay accurate behind the https
//termination that role 2 configures, rate limiting in part 2 depends on this
app.set('trust proxy', 1);

//express advertises itself in a response header by default, which tells an
//attacker exactly what stack to target
app.disable('x-powered-by');

//security headers go on every response, including errors and 404s
app.use(securityHeaders);
//a ceiling on requests per address, before any other work is done
app.use('/api', apiRateLimiter);

//-----------------------------------------------------\\
//                    REQUEST PARSING
//-----------------------------------------------------\\

//a request body larger than this is refused before it is buffered, which
//stops a single oversized payload from exhausting memory
const BODY_LIMIT = '10kb';

//the api only accepts json, urlencoded parsing stays off until a route needs it
app.use(express.json({ limit: BODY_LIMIT }));
//the body and query are checked for injection and cleaned before any route runs
app.use(sanitizeRequest);
//every api route needs a valid token unless it is listed as public
app.use('/api', requireAuthByDefault);

//-----------------------------------------------------\\
//                        ROUTES
//-----------------------------------------------------\\

//the whole api hangs off one prefix, every path the api serves is declared
//in the routes folder rather than here
app.use('/api', routes);

//the last thing mounted, anything reaching it matched no route above
//every new route must be registered before this line or it becomes a 404
app.use(notFound);

//mounted last of all, express routes an error here from anywhere above,
//including a body that failed to parse before any route was reached
app.use(errorHandler);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

//exported without calling listen so server.js owns the port binding and the
//app stays importable for role 4 testing
module.exports = app;
