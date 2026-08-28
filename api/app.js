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
//                        EXPORTS
//-----------------------------------------------------\\

//exported without calling listen so server.js owns the port binding and the
//app stays importable for role 4 testing
module.exports = app;
