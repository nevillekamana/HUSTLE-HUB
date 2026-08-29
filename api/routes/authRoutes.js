//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                      IMPORTS
//-----------------------------------------------------\\

const express = require('express');

const {
  register,
  login
} = require('../controllers/authController');

const {
  authenticateToken
} = require('../middleware/authMiddleware');

const {
  authorizeRoles
} = require('../middleware/roleMiddleware');

const {
  loginRateLimiter
} = require('../middleware/rateLimitMiddleware');


//-----------------------------------------------------\\
//                    ROUTER SETUP
//-----------------------------------------------------\\

const router = express.Router();


//-----------------------------------------------------\\
//                 AUTHENTICATION ROUTES
//-----------------------------------------------------\\

/**
 * POST /api/auth/register
 *
 * Registers a new user.
 */
router.post('/register', register);


/**
 * POST /api/auth/login
 *
 * Authenticates a user and returns a JWT token.
 *
 * The login endpoint is protected by rate limiting
 * to reduce brute-force password attacks.
 */
router.post(
  '/login',
  loginRateLimiter,
  login
);


//-----------------------------------------------------\\
//                  PROTECTED PROFILE
//-----------------------------------------------------\\

/**
 * GET /api/auth/profile
 *
 * Requires a valid JWT Bearer token.
 */
router.get(
  '/profile',
  authenticateToken,
  (req, res) => {
    return res.status(200).json({
      message: 'Protected profile accessed successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);


//-----------------------------------------------------\\
//                 ADMIN-ONLY ROUTE
//-----------------------------------------------------\\

/**
 * GET /api/auth/admin
 *
 * Demonstrates role-based authorization.
 *
 * The request must:
 * 1. Contain a valid JWT token.
 * 2. Belong to a user with the admin role.
 */
router.get(
  '/admin',
  authenticateToken,
  authorizeRoles('admin'),
  (req, res) => {
    return res.status(200).json({
      message: 'Admin-only route accessed successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);


//-----------------------------------------------------\\
//                       EXPORTS
//-----------------------------------------------------\\

module.exports = router;