//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const httpStatus = require('../utils/httpStatus');
const { sendSuccess } = require('../utils/apiResponse');
const authRoutes = require('./authRoutes');

//-----------------------------------------------------\\
//                      API ROUTER
//-----------------------------------------------------\\

//every route the api serves hangs off this one router, app.js mounts it at a
//single prefix so the api can be moved under a different path in one edit
const router = express.Router();

//liveness probe, kept clear of the auth stack so it still answers when a
//dependency further down is failing
//it replies through the shared sender like every other route, so the envelope
//cannot drift away from the rest of the api
router.get('/health', (req, res) =>
  sendSuccess(res, httpStatus.OK, 'api is running', {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  })
);

//feature routers are mounted below, each owning the paths under its prefix
router.use('/auth', authRoutes);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
