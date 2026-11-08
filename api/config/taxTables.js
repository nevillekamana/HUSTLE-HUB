const TAX_YEARS = Object.freeze({
  2026: Object.freeze({
    label: '2025/26',
    primaryRebateRand: 17235,
    taxFreeThresholdRand: 95750,
    brackets: Object.freeze([
      { fromRand: 0, ratePercent: 18 },
      { fromRand: 237100, ratePercent: 26 },
      { fromRand: 370500, ratePercent: 31 },
      { fromRand: 512800, ratePercent: 36 },
      { fromRand: 673000, ratePercent: 39 },
      { fromRand: 857900, ratePercent: 41 },
      { fromRand: 1817000, ratePercent: 45 }
    ])
  }),
  2027: Object.freeze({
    label: '2026/27',
    primaryRebateRand: 17820,
    taxFreeThresholdRand: 99000,
    brackets: Object.freeze([
      { fromRand: 0, ratePercent: 18 },
      { fromRand: 245100, ratePercent: 26 },
      { fromRand: 383100, ratePercent: 31 },
      { fromRand: 530200, ratePercent: 36 },
      { fromRand: 695800, ratePercent: 39 },
      { fromRand: 887000, ratePercent: 41 },
      { fromRand: 1878600, ratePercent: 45 }
    ])
  })
});

module.exports = { TAX_YEARS };
