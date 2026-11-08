//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { myIncome, myTax } = require('../controllers/incomeController');

//-----------------------------------------------------\\
//                      INCOME ROUTER
//-----------------------------------------------------\\

const router = express.Router();

router.get('/me', myIncome);
router.get('/tax', myTax);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
