//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess } = require('../utils/apiResponse');
const { User, toPublicUser } = require('../models/userModel');

//-----------------------------------------------------\\
//                      USER LISTING
//-----------------------------------------------------\\

//req.paging already comes from validatePaging on this row of
//config/routePolicy.js, toPublicUser keeps every password hash out of it
const listUsers = async (req, res) => {
  const { page, limit, skip } = req.paging;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments()
  ]);

  return sendSuccess(res, httpStatus.OK, 'users retrieved', {
    users: users.map(toPublicUser),
    page,
    limit,
    total
  });
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { listUsers };
