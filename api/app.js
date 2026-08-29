//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const notFound = require('./middleware/notFound');

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
//                        ROUTES
//-----------------------------------------------------\\

//liveness probe, kept free of the auth stack so it answers even when a
//dependency further down is failing
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'api is running',
    data: {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

//the last thing mounted, anything reaching it matched no route above
//every new route must be registered before this line or it becomes a 404
app.use(notFound);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

//exported without calling listen so server.js owns the port binding and the
//app stays importable for role 4 testing
module.exports = app;
