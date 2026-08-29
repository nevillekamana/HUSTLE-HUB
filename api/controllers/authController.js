//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                      IMPORTS
//-----------------------------------------------------\\

// bcrypt is used to securely hash and compare passwords.
const bcrypt = require('bcrypt');

// jsonwebtoken is used to create signed JWT authentication tokens.
const jwt = require('jsonwebtoken');

// Central environment configuration.
// Security-sensitive values are read from api/.env through config/env.js.
const env = require('../config/env');

// Required user model functions.
const {
  createUser,
  findUserByEmail,
  toPublicUser,
  isValidRole
} = require('../models/userModel');


//-----------------------------------------------------\\
//                 REGISTER CONTROLLER
//-----------------------------------------------------\\

/**
 * Registers a new HustleHub Plus user.
 *
 * Security responsibilities:
 * - Validates required input
 * - Restricts self-assignable roles
 * - Prevents duplicate email registration
 * - Hashes passwords before storage
 * - Prevents password hashes from being exposed
 */
const register = async (req, res, next) => {
  try {

    //-------------------------------------------------\\
    //              EXTRACT REQUEST DATA
    //-------------------------------------------------\\

    const {
      fullName,
      email,
      password,
      role
    } = req.body;


    //-------------------------------------------------\\
    //                INPUT VALIDATION
    //-------------------------------------------------\\

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: 'fullName, email, password and role are required'
      });
    }


    //-------------------------------------------------\\
    //                ROLE VALIDATION
    //-------------------------------------------------\\

    // Prevent users from assigning themselves a role that
    // is not permitted by the user model.
    if (!isValidRole(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }


    //-------------------------------------------------\\
    //             DUPLICATE EMAIL CHECK
    //-------------------------------------------------\\

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }


    //-------------------------------------------------\\
    //                 PASSWORD HASHING
    //-------------------------------------------------\\

    // Plain-text passwords must never be stored.
    // bcrypt hashes the password before the user record is created.
    const SALT_ROUNDS = 10;

    const passwordHash = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );


    //-------------------------------------------------\\
    //                 CREATE USER
    //-------------------------------------------------\\

    const user = await createUser({
      fullName,
      email,
      passwordHash,
      role
    });


    //-------------------------------------------------\\
    //                SUCCESS RESPONSE
    //-------------------------------------------------\\

    // toPublicUser ensures passwordHash is excluded
    // from the response returned to the client.
    return res.status(201).json({
      message: 'User registered successfully',
      user: toPublicUser(user)
    });

  } catch (error) {

    //-------------------------------------------------\\
    //                 ERROR HANDLING
    //-------------------------------------------------\\

    // Forward unexpected errors to the application's
    // central error-handling middleware.
    next(error);
  }
};


//-----------------------------------------------------\\
//                   LOGIN CONTROLLER
//-----------------------------------------------------\\

/**
 * Authenticates an existing HustleHub Plus user.
 *
 * Security responsibilities:
 * - Validates login input
 * - Avoids revealing whether an email exists
 * - Compares passwords using bcrypt
 * - Generates a signed JWT
 * - Includes the user's role for authorization
 */
const login = async (req, res, next) => {
  try {

    //-------------------------------------------------\\
    //              EXTRACT REQUEST DATA
    //-------------------------------------------------\\

    const {
      email,
      password
    } = req.body;


    //-------------------------------------------------\\
    //                INPUT VALIDATION
    //-------------------------------------------------\\

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }


    //-------------------------------------------------\\
    //                  FIND USER
    //-------------------------------------------------\\

    const user = await findUserByEmail(email);

    // Use the same error message for unknown emails
    // and incorrect passwords to reduce account enumeration.
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }


    //-------------------------------------------------\\
    //              PASSWORD VERIFICATION
    //-------------------------------------------------\\

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }


    //-------------------------------------------------\\
    //               JWT TOKEN CREATION
    //-------------------------------------------------\\

    // Only the minimum information required for
    // authentication and authorization is included.
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // env.jwtSecret is loaded securely from api/.env
    // through config/env.js.
    const token = jwt.sign(
      tokenPayload,
      env.jwtSecret,
      {
        expiresIn: '1h'
      }
    );


    //-------------------------------------------------\\
    //                SUCCESS RESPONSE
    //-------------------------------------------------\\

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: toPublicUser(user)
    });

  } catch (error) {

    //-------------------------------------------------\\
    //                 ERROR HANDLING
    //-------------------------------------------------\\

    next(error);
  }
};


//-----------------------------------------------------\\
//                       EXPORTS
//-----------------------------------------------------\\

module.exports = {
  register,
  login
};