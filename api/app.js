//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const { sanitizeRequest } = require('./middleware/sanitizeMiddleware');
const requireAuthByDefault = require('./middleware/apiGuard');
const enforceRoutePolicy = require('./middleware/routeGuard');
const { apiRateLimiter } = require('./middleware/rateLimitMiddleware');

//-----------------------------------------------------\\
//                   APPLICATION SETUP
//-----------------------------------------------------\\

const app = express();

//trusting the first proxy hop only makes sense once something is actually
//terminating tls in front of the api (part 3's reverse proxy), locally and
//in this deployment nothing sits in front of it, so trusting a client
//supplied x-forwarded-for would let every ip keyed rate limit be bypassed by
//just sending a new one on each request, see TRUST_PROXY in config/env.js
app.set('trust proxy', env.trustProxy ? 1 : false);

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
//each protected address gets its role check and validation from one table
app.use('/api', enforceRoutePolicy);

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
