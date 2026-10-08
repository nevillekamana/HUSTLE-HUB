//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess, sendFailure } = require('../utils/apiResponse');
const { Booking, toPublicBooking } = require('../models/bookingModel');
const { toPublicTransaction } = require('../models/transactionModel');
const bookingService = require('../services/bookingService');

//-----------------------------------------------------\\
//                        HELPERS
//-----------------------------------------------------\\

const populateBooking = (queryOrDoc) =>
  queryOrDoc.populate('gig', 'title category').populate('client', 'fullName').populate('freelancer', 'fullName');

//only a client or a freelancer who is actually a party to the booking may
//ever see it, config/routePolicy.js does not allow an admin onto this
//route at all, so there is no third branch to handle here
const participantFilter = (auth) => ({ $or: [{ client: auth.id }, { freelancer: auth.id }] });

//-----------------------------------------------------\\
//                     CREATE A BOOKING
//-----------------------------------------------------\\

//the booking rate limit already ran in middleware/routeGuard.js against
//config/routePolicy.js before this handler, adding another here would count
//the same request twice
const create = async (req, res) => {
  try {
    const { booking, transaction } = await bookingService.createBooking({
      gigId: req.body.gigId,
      clientId: req.auth.id
    });

    return sendSuccess(res, httpStatus.CREATED, 'booking confirmed', {
      booking: toPublicBooking(booking, false),
      transaction: toPublicTransaction(transaction, false)
    });
  } catch (error) {
    if (error.code === bookingService.GIG_NOT_FOUND) {
      return sendFailure(res, httpStatus.NOT_FOUND, error.message);
    }

    if (error.code === bookingService.OWN_GIG) {
      return sendFailure(res, httpStatus.CONFLICT, error.message);
    }

    throw error;
  }
};

//-----------------------------------------------------\\
//                         LISTING
//-----------------------------------------------------\\

const listMine = async (req, res) => {
  const bookings = await populateBooking(Booking.find(participantFilter(req.auth)).sort({ createdAt: -1 }));

  return sendSuccess(res, httpStatus.OK, 'bookings retrieved', {
    bookings: bookings.map((booking) => toPublicBooking(booking, true))
  });
};

//the participant filter doubles as the ownership check, someone who is
//neither the client nor the freelancer on a booking gets the same 404 as
//one that does not exist
const getById = async (req, res) => {
  const booking = await populateBooking(
    Booking.findOne({ _id: req.params.id, ...participantFilter(req.auth) })
  );

  if (!booking) {
    return sendFailure(res, httpStatus.NOT_FOUND, 'booking not found');
  }

  return sendSuccess(res, httpStatus.OK, 'booking retrieved', { booking: toPublicBooking(booking, true) });
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { create, listMine, getById };
