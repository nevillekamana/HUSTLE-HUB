//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const authRoutes = require('./routes/authRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');


//-----------------------------------------------------\\
//                   APPLICATION SETUP
//-----------------------------------------------------\\

const app = express();

// Trust the first proxy hop so client IP addresses remain
// accurate when the application is running behind a proxy.
// This also supports rate limiting when deployed behind HTTPS.
app.set('trust proxy', 1);

// Disable the X-Powered-By header so the API does not
// unnecessarily expose the Express framework to clients.
app.disable('x-powered-by');


//-----------------------------------------------------\\
//                    REQUEST PARSING
//-----------------------------------------------------\\

// Limit JSON request bodies to reduce the risk of
// oversized payloads consuming excessive server resources.
const BODY_LIMIT = '10kb';

app.use(express.json({
  limit: BODY_LIMIT
}));


//-----------------------------------------------------\\
//                     HEALTH ROUTE
//-----------------------------------------------------\\

/**
 * GET /api/health
 *
 * Confirms that the HustleHub Plus API is running.
 */
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


//-----------------------------------------------------\\
//                  AUTHENTICATION ROUTES
//-----------------------------------------------------\\

// Authentication endpoints:
//
// POST /api/auth/register
// POST /api/auth/login
//
app.use('/api/auth', authRoutes);


//-----------------------------------------------------\\
//                   NOT FOUND HANDLER
//-----------------------------------------------------\\

// Requests that do not match any registered route
// are handled by the standard 404 middleware.
app.use(notFound);


//-----------------------------------------------------\\
//                    ERROR HANDLER
//-----------------------------------------------------\\

// Centralised error handling must remain the final
// middleware in the request pipeline.
app.use(errorHandler);


//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

// server.js is responsible for starting the HTTP server,
// which keeps this file easy to import during testing.
module.exports = app;