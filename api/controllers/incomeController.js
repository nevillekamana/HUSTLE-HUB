//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess } = require('../utils/apiResponse');
const { getIncome } = require('../services/incomeService');

//-----------------------------------------------------\\
//                      MY INCOME
//-----------------------------------------------------\\

const myIncome = async (req, res) => {
  const income = await getIncome(req.auth.id);

  return sendSuccess(res, httpStatus.OK, 'income retrieved', { income });
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { myIncome };
