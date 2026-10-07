//-----------------------------------------------------\\
//                     RANDS AND CENTS
//-----------------------------------------------------\\

//money travels as whole cents everywhere and only becomes rands on screen,
//so no amount is ever rounded twice or held as a floating point sum
//formatted by hand rather than with Intl, whose south african format differs
//between browsers (a comma decimal in some, a narrow space in others), this
//always reads "R 1 500.00"
const formatCents = (cents) => {
  const value = Number.isFinite(Number(cents)) ? Math.round(Number(cents)) : 0;
  const sign = value < 0 ? '-' : '';
  const whole = Math.floor(Math.abs(value) / 100);
  const fraction = String(Math.abs(value) % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return sign + 'R ' + grouped + '.' + fraction;
};

//a short form for tight spaces such as the top of a chart column, R 950,
//R 1.5k or R 2.3m, the full amount is always shown somewhere beside it
const formatCentsShort = (cents) => {
  const rands = Number.isFinite(Number(cents)) ? Math.max(0, Number(cents)) / 100 : 0;
  const short = (value, unit) => 'R ' + (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '') + unit;

  if (Math.round(rands) < 1000) {
    return 'R ' + Math.round(rands);
  }

  return rands < 999950 ? short(rands / 1000, 'k') : short(rands / 1000000, 'm');
};

//a rand amount typed into a form, as whole cents (plan section 8.6), or null
//when the text is not a plain number, so the caller decides what an empty or
//bad value means
//spaces are dropped first, so 2 500 is read the way prices are shown here
const toCents = (rands) => {
  const text = String(rands === undefined || rands === null ? '' : rands).replace(/\s+/g, '');

  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }

  return Math.round(Number(text) * 100);
};

//the other way, for filling a form with a stored price, whole rands stay
//whole and anything else keeps two decimals, so 150000 reads 1500 and 9950
//reads 99.50
const toRands = (cents) => {
  const value = Math.round(Number(cents));

  if (!Number.isFinite(value) || value < 0) {
    return '';
  }

  return value % 100 === 0 ? String(value / 100) : (value / 100).toFixed(2);
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { formatCents, formatCentsShort, toCents, toRands };
