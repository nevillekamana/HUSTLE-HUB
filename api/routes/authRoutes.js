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
const {
  validateRegister,
  validateLogin
} = require('../middleware/validationMiddleware');
const { ROLES } = require('../models/userModel');

//-----------------------------------------------------\\
//                     AUTH ROUTES
//-----------------------------------------------------\\

//its own router so every auth path is declared in one place, the mount point
//in app.js can then change without any path in here being rewritten
const router = express.Router();

//creates an account, answers 201 with the safe user object, 409 when the
//address is taken and 400 when a field is missing or fails its format rule
//validation runs first so a malformed body is refused before any lookup or hash
router.post('/register', validateRegister, register);

//verifies a credential pair, answers 200 with the safe user and a token, and
//401 with one message whether the address or the password was wrong
//the limiter sits in front of it because this is the endpoint worth guessing at,
//and it stays in front of validation so a flood of junk is throttled as well
router.post('/login', loginRateLimiter, validateLogin, login);

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
