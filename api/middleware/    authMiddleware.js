//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                      IMPORTS
//-----------------------------------------------------\\

const jwt = require('jsonwebtoken');
const env = require('../config/env');


//-----------------------------------------------------\\
//               JWT AUTHENTICATION
//-----------------------------------------------------\\

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication token is required'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Authentication token is required'
      });
    }

    const decoded = jwt.verify(
      token,
      env.jwtSecret
    );

    req.user = decoded;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Authentication token has expired'
      });
    }

    return res.status(401).json({
      message: 'Invalid authentication token'
    });
  }
};


//-----------------------------------------------------\\
//                       EXPORTS
//-----------------------------------------------------\\

module.exports = {
  authenticateToken
};