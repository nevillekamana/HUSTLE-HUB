//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');

//-----------------------------------------------------\\
//                     AUTH ROUTES
//-----------------------------------------------------\\

//its own router so every auth path is declared in one place, the mount point
//in app.js can then change without any path in here being rewritten
const router = express.Router();

//the handlers are added by the commits that follow this one, register first,
//then login, then the protected profile route
//until each is mounted its path falls through to the not found handler, which
//answers 404 in the standard envelope rather than failing in some other way

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
