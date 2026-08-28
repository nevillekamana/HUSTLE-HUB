//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');

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

//-----------------------------------------------------\\
//                    REQUEST PARSING
//-----------------------------------------------------\\

//a request body larger than this is refused before it is buffered, which
//stops a single oversized payload from exhausting memory
const BODY_LIMIT = '10kb';

//the api only accepts json, urlencoded parsing stays off until a route needs it
app.use(express.json({ limit: BODY_LIMIT }));

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

//exported without calling listen so server.js owns the port binding and the
//app stays importable for role 4 testing
module.exports = app;
