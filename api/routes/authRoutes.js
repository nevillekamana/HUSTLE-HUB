//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { register } = require('../controllers/authController');

//-----------------------------------------------------\\
//                     AUTH ROUTES
//-----------------------------------------------------\\

//its own router so every auth path is declared in one place, the mount point
//in app.js can then change without any path in here being rewritten
const router = express.Router();

//creates an account, answers 201 with the safe user object, 409 when the
//address is taken and 400 when a required field is missing
router.post('/register', register);

//login and the protected profile route are added by the commits that follow,
//until each is mounted its path falls through to the not found handler

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
