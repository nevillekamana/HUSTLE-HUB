//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { listUsers } = require('../controllers/adminController');

//-----------------------------------------------------\\
//                      ADMIN ROUTER
//-----------------------------------------------------\\

//config/routePolicy.js also has a '/admin/*' catch all for anything added
//here later, every address under this prefix needs the admin role already
const router = express.Router();

router.get('/users', listUsers);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
