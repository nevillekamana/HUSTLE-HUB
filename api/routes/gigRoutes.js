//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const express = require('express');
const {
  browseGigs,
  listMine,
  getGigById,
  createGig,
  updateGig,
  patchGig,
  softDeleteGig
} = require('../controllers/gigController');

//-----------------------------------------------------\\
//                      GIG ROUTER
//-----------------------------------------------------\\

//auth, role and validation already ran in middleware/routeGuard.js against
//config/routePolicy.js before a request reaches here, so this router only
//wires addresses to handlers, nothing else
const router = express.Router();

//a fixed path must be declared before a ':id' one or express would try to
//load a gig named 'mine', the same ordering routePolicy.js itself keeps
router.get('/mine', listMine);
router.get('/:id', getGigById);
router.get('/', browseGigs);

router.post('/', createGig);

router.put('/:id', updateGig);
router.patch('/:id', patchGig);

router.delete('/:id', softDeleteGig);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = router;
