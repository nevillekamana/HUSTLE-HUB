//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const {
  register,
  login,
  profile,
  adminArea
} = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { loginRateLimiter } = require('../middleware/rateLimitMiddleware');
const { ROLES } = require('../models/userModel');

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
//the limiter sits in front of it because this is the endpoint worth guessing at
router.post('/login', loginRateLimiter, login);

//the guard runs first and the handler is never reached without a token this
//api signed
router.get('/profile', requireAuth, profile);

//identity first, then permission, the order matters because an unknown caller
//is unauthorised while a known one holding the wrong role is forbidden
router.get('/admin', requireAuth, authorizeRoles(ROLES.ADMIN), adminArea);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
