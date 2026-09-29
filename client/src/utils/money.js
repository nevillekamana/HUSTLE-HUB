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

//a rand amount typed into a form, as whole cents (plan section 8.6), or null
//when the text is not a plain number, so the caller decides what an empty or
//bad value means
const toCents = (rands) => {
  const text = String(rands === undefined || rands === null ? '' : rands).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }

  return Math.round(Number(text) * 100);
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { formatCents, toCents };
