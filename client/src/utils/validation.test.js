import { describe, it, expect } from 'vitest'

// Local copies of validation rules mirroring the client's expected behaviour.
const categories = ['design','writing','development','marketing','tutoring','other']

function isValidEmail(email){
  if(!email || typeof email !== 'string') return false
  // simple email regex for tests
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

function isStrongPassword(p){
  if(typeof p !== 'string') return false
  if(p.length < 8 || p.length > 128) return false
  return /[A-Za-z]/.test(p) && /[0-9]/.test(p)
}

function validateGig({ title, description, category, priceRands }){
  const errors = {}
  if(!title || title.trim().length < 3) errors.title = 'title too short'
  if(!description || description.trim().length < 10) errors.description = 'description too short'
  if(!categories.includes((category||'').toLowerCase())) errors.category = 'unknown category'
  const priceCents = Math.round((Number(priceRands) || 0) * 100)
  if(!Number.isInteger(priceCents) || priceCents < 100 || priceCents > 10000000) errors.price = 'price out of range'
  if(/[<>]/.test(title) || /[<>]/.test(description)) errors.markup = 'markup not allowed'
  return { valid: Object.keys(errors).length === 0, errors, priceCents }
}

describe('validation rules', () => {
  it('email validation accepts good emails', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail('bad')).toBe(false)
  })

  it('password strength rule enforces length and digit+letter', () => {
    expect(isStrongPassword('Password1')).toBe(true)
    expect(isStrongPassword('short1')).toBe(false)
    expect(isStrongPassword('allletters')).toBe(false)
  })

  it('gig validation enforces fields and rands->cents conversion', () => {
    const ok = validateGig({ title: 'Good gig', description: 'Long enough description', category: 'development', priceRands: '10' })
    expect(ok.valid).toBe(true)
    expect(ok.priceCents).toBe(1000)

    const bad = validateGig({ title: 'x', description: 'short', category: 'unknown', priceRands: '0.5' })
    expect(bad.valid).toBe(false)
    expect(bad.errors).toHaveProperty('title')
    expect(bad.errors).toHaveProperty('description')
    expect(bad.errors).toHaveProperty('category')
    expect(bad.errors).toHaveProperty('price')
  })
})
