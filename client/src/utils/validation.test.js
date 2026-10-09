//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { describe, expect, it } from 'vitest';
import { mapFieldErrors, validateGig, validateLogin, validateRegister } from '@/utils/validation';

//-----------------------------------------------------\\
//                  FORM VALIDATION TESTS
//-----------------------------------------------------\\

//these rules mirror the api's, so a regression here means the forms and the
//backend have drifted apart

const goodRegister = {
  fullName: "Thandi O'Neil-Dlamini",
  email: 'thandi@example.co.za',
  password: 'Passw0rdOK',
  role: 'freelancer'
};

describe('validateRegister', () => {
  it('accepts a complete, valid sign up', () => {
    expect(validateRegister(goodRegister)).toEqual({});
  });

  it('reports every missing field at once', () => {
    const errors = validateRegister({});
    expect(Object.keys(errors).sort()).toEqual(['email', 'fullName', 'password', 'role']);
  });

  it('rejects a password with no digit, and one that is too short', () => {
    expect(validateRegister({ ...goodRegister, password: 'onlyletters' }).password).toMatch(/letter and one number/);
    expect(validateRegister({ ...goodRegister, password: 'a1' }).password).toMatch(/between 8 and 128/);
  });

  it('rejects a malformed email address', () => {
    expect(validateRegister({ ...goodRegister, email: 'not-an-email' }).email).toMatch(/valid email/);
  });

  it('refuses the admin role, which cannot be self assigned', () => {
    expect(validateRegister({ ...goodRegister, role: 'admin' }).role).toMatch(/client or freelancer/);
  });

  it('rejects markup in a name', () => {
    expect(validateRegister({ ...goodRegister, fullName: '<script>alert(1)</script>' }).fullName).toBeTruthy();
  });
});

describe('validateLogin', () => {
  it('only asks that both fields are filled', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'is required',
      password: 'is required'
    });
    expect(validateLogin({ email: 'x', password: 'y' })).toEqual({});
  });
});

describe('validateGig', () => {
  const goodGig = {
    title: 'Logo design',
    description: 'A clean logo with two revisions included.',
    category: 'design',
    price: '250.50'
  };

  it('accepts a valid gig', () => {
    expect(validateGig(goodGig)).toEqual({});
  });

  it('refuses angle brackets in gig text', () => {
    expect(validateGig({ ...goodGig, title: 'Hi <b>there</b>' }).title).toMatch(/must not contain/);
  });

  it('enforces the price range of R 1 to R 100 000', () => {
    expect(validateGig({ ...goodGig, price: '0.50' }).price).toMatch(/between R 1 and R 100 000/);
    expect(validateGig({ ...goodGig, price: '100001' }).price).toMatch(/between R 1 and R 100 000/);
  });

  it('refuses an unknown category', () => {
    expect(validateGig({ ...goodGig, category: 'hacking' }).category).toMatch(/must be one of/);
  });
});

describe('mapFieldErrors', () => {
  it('keeps errors for known fields and flags the rest as unmatched', () => {
    const result = mapFieldErrors(
      [
        { field: 'email', message: 'is required' },
        { field: 'rateLimit', message: 'try later' }
      ],
      ['email', 'password']
    );

    expect(result.errors).toEqual({ email: 'is required' });
    expect(result.unmatched).toBe(true);
  });
});
