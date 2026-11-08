const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateTax, SUPPORTED_TAX_YEARS, taxYearOf, defaultTaxYear } = require('../services/taxService');

test('supports SARS 2025/26 and 2026/27 tables', () => assert.deepEqual(SUPPORTED_TAX_YEARS, [2026, 2027]));
test('rebate makes income below threshold tax free', () => {
  assert.equal(estimateTax(9900000, 2027).estimatedTaxCents, 0);
  assert.equal(estimateTax(10000000, 2027).estimatedTaxCents, 18000);
});
test('calculates 2026/27 bracket boundaries and high income', () => {
  assert.equal(estimateTax(24510000, 2027).taxBeforeRebatesCents, 4411800);
  assert.equal(estimateTax(50000000, 2027).taxBeforeRebatesCents, 11623700);
  assert.equal(estimateTax(200000000, 2027).estimatedTaxCents, 70314900);
});
test('calculates the separate 2025/26 table', () => assert.equal(estimateTax(50000000, 2026).estimatedTaxCents, 10027200));
test('rejects invalid income and unsupported years', () => {
  assert.throws(() => estimateTax(-1, 2027));
  assert.throws(() => estimateTax(1.5, 2027));
  assert.throws(() => estimateTax(1, 2031));
});
test('selects current supported year or nearest available table', () => {
  assert.equal(taxYearOf(new Date('2026-03-01T00:00:00Z')), 2027);
  assert.equal(defaultTaxYear(new Date('2027-04-01T00:00:00Z')), 2027);
});
