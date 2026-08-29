//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { register, login } = require('../controllers/authController');

//-----------------------------------------------------\\
//                     AUTH ROUTES
//-----------------------------------------------------\\

//its own router so every auth path is declared in one place, the mount point
//in app.js can then change without any path in here being rewritten
const router = express.Router();

//creates an account, answers 201 with the safe user object, 409 when the
//address is taken and 400 when a required field is missing
router.post('/register', register);

//verifies a credential pair, answers 200 with the safe user and a token, and
//401 with one message whether the address or the password was wrong
router.post('/login', login);

//the protected profile route is added by a later commit, until then its path
//falls through to the not found handler

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
