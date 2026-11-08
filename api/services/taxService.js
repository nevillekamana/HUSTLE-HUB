const { TAX_YEARS } = require('../config/taxTables');

const SUPPORTED_TAX_YEARS = Object.freeze(Object.keys(TAX_YEARS).map(Number).sort((a, b) => a - b));
const SAST_OFFSET_HOURS = 2;
const isSupportedTaxYear = (year) => SUPPORTED_TAX_YEARS.includes(year);

const taxYearOf = (date = new Date()) => {
  const local = new Date(date.getTime() + SAST_OFFSET_HOURS * 60 * 60 * 1000);
  return local.getUTCMonth() >= 2 ? local.getUTCFullYear() + 1 : local.getUTCFullYear();
};

const taxYearBounds = (taxYear) => ({
  start: new Date(Date.UTC(taxYear - 1, 2, 1, -SAST_OFFSET_HOURS)),
  end: new Date(Date.UTC(taxYear, 2, 1, -SAST_OFFSET_HOURS))
});

const defaultTaxYear = (date = new Date()) => {
  const current = taxYearOf(date);
  return isSupportedTaxYear(current)
    ? current
    : current > SUPPORTED_TAX_YEARS.at(-1) ? SUPPORTED_TAX_YEARS.at(-1) : SUPPORTED_TAX_YEARS[0];
};

const estimateTax = (grossIncomeCents, taxYear) => {
  const table = TAX_YEARS[taxYear];
  if (!table) throw new Error('unsupported tax year');
  if (!Number.isSafeInteger(grossIncomeCents) || grossIncomeCents < 0) {
    throw new Error('income must be a non-negative integer number of cents');
  }

  let taxBeforeRebatesCents = 0;
  const brackets = table.brackets.map((bracket, index) => {
    const fromCents = bracket.fromRand * 100;
    const next = table.brackets[index + 1];
    const toCents = next ? next.fromRand * 100 : null;
    const incomeInBracketCents = Math.max(0, Math.min(grossIncomeCents, toCents ?? grossIncomeCents) - fromCents);
    const taxCents = Math.round(incomeInBracketCents * bracket.ratePercent / 100);
    taxBeforeRebatesCents += taxCents;
    return { fromCents, toCents, ratePercent: bracket.ratePercent, incomeInBracketCents, taxCents };
  });

  const primaryRebateCents = table.primaryRebateRand * 100;
  const estimatedTaxCents = Math.max(0, taxBeforeRebatesCents - primaryRebateCents);
  const reached = brackets.filter((bracket) => bracket.incomeInBracketCents > 0);
  return {
    taxYear,
    taxYearLabel: table.label,
    grossIncomeCents,
    taxableIncomeCents: grossIncomeCents,
    taxBeforeRebatesCents,
    primaryRebateCents,
    estimatedTaxCents,
    netIncomeCents: grossIncomeCents - estimatedTaxCents,
    taxFreeThresholdCents: table.taxFreeThresholdRand * 100,
    belowTaxThreshold: estimatedTaxCents === 0,
    effectiveRatePercent: grossIncomeCents ? Math.round(estimatedTaxCents / grossIncomeCents * 10000) / 100 : 0,
    marginalRatePercent: reached.at(-1)?.ratePercent || 0,
    brackets
  };
};

const ASSUMPTIONS = Object.freeze([
  'Freelance gross income is treated as taxable business income.',
  'Expenses and deductions are not subtracted.',
  'Only the primary rebate is applied because age is not stored.',
  'The estimate uses completed earnings so far, not projected annual earnings.'
]);
const DISCLAIMER = 'This estimate is for planning only and is not professional tax advice or a SARS assessment.';

module.exports = { SUPPORTED_TAX_YEARS, isSupportedTaxYear, taxYearOf, defaultTaxYear, taxYearBounds, estimateTax, ASSUMPTIONS, DISCLAIMER };
