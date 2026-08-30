//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { register, login, profile } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

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

//the only protected route, the guard runs first and the handler is never
//reached without a token this api signed
router.get('/profile', requireAuth, profile);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
