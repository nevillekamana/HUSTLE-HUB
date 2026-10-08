//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess, sendFailure } = require('../utils/apiResponse');
const { escapeRegex } = require('../middleware/resourceValidation');
const { Gig, toPublicGig } = require('../models/gigModel');
const { ROLES } = require('../models/userModel');

//-----------------------------------------------------\\
//                        HELPERS
//-----------------------------------------------------\\

//freelancer is populated as the same shallow { fullName } shape everywhere a
//gig is returned, a query and a freshly created document both accept this
const populateFreelancer = (queryOrDoc) => queryOrDoc.populate('freelancer', 'fullName');

//-----------------------------------------------------\\
//                        BROWSE
//-----------------------------------------------------\\

//only an active, non deleted gig is ever findable here, filters already
//arrive type checked and limit capped from validateGigQuery
const browseGigs = async (req, res) => {
  const { category, q, minPrice, maxPrice } = req.filters || {};
  const filter = { isActive: true, deletedAt: null };

  if (category) {
    filter.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.priceCents = {};
    if (minPrice !== undefined) {
      filter.priceCents.$gte = minPrice;
    }
    if (maxPrice !== undefined) {
      filter.priceCents.$lte = maxPrice;
    }
  }

  //escaped before it ever reaches $regex, an unescaped '.' or '*' from a
  //search box would otherwise be read as a pattern instead of text
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const { page, limit, skip } = req.paging;

  const [gigs, total] = await Promise.all([
    populateFreelancer(Gig.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Gig.countDocuments(filter)
  ]);

  return sendSuccess(res, httpStatus.OK, 'gigs retrieved', {
    gigs: gigs.map(toPublicGig),
    page,
    limit,
    total
  });
};

//a freelancer's own gigs, including the inactive ones browse would hide
const listMine = async (req, res) => {
  const gigs = await populateFreelancer(
    Gig.find({ freelancer: req.auth.id, deletedAt: null }).sort({ createdAt: -1 })
  );

  return sendSuccess(res, httpStatus.OK, 'gigs retrieved', { gigs: gigs.map(toPublicGig) });
};

//an inactive gig is visible only to its owner and an admin, everyone else
//gets the same 404 as a gig that never existed
const getGigById = async (req, res) => {
  const gig = await populateFreelancer(Gig.findOne({ _id: req.params.id, deletedAt: null }));
  const canSeeHidden = gig && (String(gig.freelancer.id) === req.auth.id || req.auth.role === ROLES.ADMIN);

  if (!gig || (!gig.isActive && !canSeeHidden)) {
    return sendFailure(res, httpStatus.NOT_FOUND, 'gig not found');
  }

  return sendSuccess(res, httpStatus.OK, 'gig retrieved', { gig: toPublicGig(gig) });
};

//-----------------------------------------------------\\
//                     OWNED BY THE CALLER
//-----------------------------------------------------\\

//the owner comes from the verified token and never from the body, which
//validateGigCreate has already refused to carry a freelancer field anyway
const createGig = async (req, res) => {
  const gig = await populateFreelancer(
    await Gig.create({
      freelancer: req.auth.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      priceCents: req.body.priceCents
    })
  );

  return sendSuccess(res, httpStatus.CREATED, 'gig created', { gig: toPublicGig(gig) });
};

//ownership is part of the lookup itself, so a gig belonging to someone else
//reads as not found rather than forbidden, and cannot leak that it exists
//req.body holds only the fields that were actually sent, already validated,
//by validateGigUpdate
const updateGig = async (req, res) => {
  const gig = await populateFreelancer(
    Gig.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.auth.id, deletedAt: null },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    )
  );

  if (!gig) {
    return sendFailure(res, httpStatus.NOT_FOUND, 'gig not found');
  }

  return sendSuccess(res, httpStatus.OK, 'gig updated', { gig: toPublicGig(gig) });
};

//a soft delete, bookings and transactions still point at this gig afterwards,
//the owner or an admin may remove it, everyone else gets the 404
const softDeleteGig = async (req, res) => {
  const filter = { _id: req.params.id, deletedAt: null };

  if (req.auth.role !== ROLES.ADMIN) {
    filter.freelancer = req.auth.id;
  }

  const gig = await populateFreelancer(
    Gig.findOneAndUpdate(filter, { $set: { isActive: false, deletedAt: new Date() } }, { returnDocument: 'after' })
  );

  if (!gig) {
    return sendFailure(res, httpStatus.NOT_FOUND, 'gig not found');
  }

  return sendSuccess(res, httpStatus.OK, 'gig deleted', { gig: toPublicGig(gig) });
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  browseGigs,
  listMine,
  getGigById,
  createGig,
  updateGig,
  //PATCH and PUT are the same partial-update rules (validateGigUpdate
  //already requires at least one field either way), so they share a handler
  patchGig: updateGig,
  softDeleteGig
};
