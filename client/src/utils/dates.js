//-----------------------------------------------------\\
//                         DATES
//-----------------------------------------------------\\

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//"24 Sep 2026" in the viewer's own time zone, spelled out by hand so every
//browser shows the same thing, anything that is not a real date shows a dash
//rather than "Invalid Date"
const formatDate = (value) => {
  const date = new Date(value);

  if (value === undefined || value === null || Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
};

//"2026-09" as the api groups income, shown as "Sep 2026"
const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;

const formatMonth = (key) => {
  const match = MONTH_KEY.exec(String(key));
  return match ? MONTHS[Number(match[2]) - 1] + ' ' + match[1] : '—';
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { MONTHS, MONTH_KEY, formatDate, formatMonth };
