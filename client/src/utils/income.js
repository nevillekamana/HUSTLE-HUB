//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { MONTH_KEY } from '@/utils/dates';

//-----------------------------------------------------\\
//                     READ INCOME
//-----------------------------------------------------\\

//a month range longer than this is not filled in, it can only come from a
//bad date and would otherwise draw hundreds of empty columns
const MAX_FILLED_MONTHS = 120;

const wholeCount = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);

//"2026-09" to "2026-10", and "2026-12" to "2027-01"
const nextMonth = (key) => {
  const [year, month] = key.split('-').map(Number);
  return month === 12 ? year + 1 + '-01' : year + '-' + String(month + 1).padStart(2, '0');
};

//the api lists only months that earned something, a chart over time needs
//the quiet months in between too, so they are added as zero
const fillMonths = (rows) => {
  if (rows.length === 0) {
    return [];
  }

  const known = new Map(rows.map((row) => [row.month, row]));
  const last = rows[rows.length - 1].month;
  const filled = [];

  for (let key = rows[0].month; filled.length <= MAX_FILLED_MONTHS; key = nextMonth(key)) {
    filled.push(known.get(key) || { month: key, totalCents: 0, count: 0 });

    if (key === last) {
      return filled;
    }
  }

  return rows;
};

//the api's income summary with every part checked, a missing or malformed
//field reads as nothing earned rather than breaking the page
//gigs are biggest first, months oldest first
const readIncome = (income) => {
  const source = income && typeof income === 'object' ? income : {};

  const byGig = (Array.isArray(source.byGig) ? source.byGig : [])
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      gigId: typeof row.gigId === 'string' ? row.gigId : null,
      title: typeof row.title === 'string' && row.title.trim() !== '' ? row.title : 'Removed gig',
      totalCents: wholeCount(row.totalCents),
      count: wholeCount(row.count)
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const byMonth = (Array.isArray(source.byMonth) ? source.byMonth : [])
    .filter((row) => row && typeof row === 'object' && MONTH_KEY.test(row.month))
    .map((row) => ({ month: row.month, totalCents: wholeCount(row.totalCents), count: wholeCount(row.count) }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  return {
    totalCents: wholeCount(source.totalCents),
    count: wholeCount(source.transactionCount),
    byGig,
    byMonth: fillMonths(byMonth)
  };
};

//-----------------------------------------------------\\
//                     SHARE OF TOTAL
//-----------------------------------------------------\\

//a whole percentage, with a sliver of income still showing as under 1%
const shareOf = (part, whole) => {
  if (!whole || !part) {
    return '0%';
  }

  const percent = Math.round((part / whole) * 100);
  return percent === 0 ? 'Under 1%' : percent + '%';
};

const plural = (count, word) => count + ' ' + word + (count === 1 ? '' : 's');

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { plural, readIncome, shareOf };
