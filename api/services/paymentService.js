//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const { randomBytes } = require('crypto');

//-----------------------------------------------------\\
//                      SIMULATION
//-----------------------------------------------------\\

//base32-ish, no 0/1/O/I, so a reference read aloud cannot be misheard
const REFERENCE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const newReference = () =>
  'SIM-' + Array.from(randomBytes(10), (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('');

//stands in for a real payment gateway, part 2 asks only for a simulated
//confirmation, no card or bank detail is ever collected or stored, amount is
//taken so the signature matches what a real gateway call would need
const simulatePayment = async ({ amountCents }) => ({
  status: 'completed',
  reference: newReference()
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { simulatePayment };
