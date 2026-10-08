//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const { create, listMine, getById } = require('../controllers/bookingController');

//-----------------------------------------------------\\
//                     BOOKING ROUTER
//-----------------------------------------------------\\

//auth, role, the booking rate limit, id and body validation already ran in
//middleware/routeGuard.js against config/routePolicy.js before a request
//reaches here
const router = express.Router();

//a fixed path before a ':id' one, the same ordering routePolicy.js keeps
router.get('/mine', listMine);
router.get('/:id', getById);

router.post('/', create);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
