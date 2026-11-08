//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess } = require('../utils/apiResponse');
const { getIncome, getTaxEstimate } = require('../services/incomeService');

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

const myTax = async (req, res) => {
  const tax = await getTaxEstimate(req.auth.id, req.taxYear);
  return sendSuccess(res, httpStatus.OK, 'tax estimate retrieved', { tax });
};

module.exports = { myIncome, myTax };
