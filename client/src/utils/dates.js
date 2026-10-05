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

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { MONTHS, formatDate };
