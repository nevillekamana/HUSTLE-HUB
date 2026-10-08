//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { listMine, listAll } = require('../controllers/transactionController');

//-----------------------------------------------------\\
//                   TRANSACTION ROUTER
//-----------------------------------------------------\\

const router = express.Router();

router.get('/mine', listMine);
router.get('/', listAll);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
