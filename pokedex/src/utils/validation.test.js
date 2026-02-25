import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateCode,
  validateTeamName,
  validateRegisterForm,
  validateLoginForm
} from '../utils/validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('Secure123')).toBe(true)
      expect(validatePassword('MyPassword456')).toBe(true)
      expect(validatePassword('Test@Pass123')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(validatePassword('short')).toBe(false)
      expect(validatePassword('nouppercase123')).toBe(false)
      expect(validatePassword('NOLOWERCASE123')).toBe(false)
      expect(validatePassword('NoNumbers')).toBe(false)
      expect(validatePassword('')).toBe(false)
    })
  })

  describe('validateCode', () => {
    it('should accept valid codes', () => {
      expect(validateCode('abc123')).toBe(true)
      expect(validateCode('xyz9876')).toBe(true)
      expect(validateCode('code123456')).toBe(true)
    })

    it('should reject invalid codes', () => {
      expect(validateCode('ab')).toBe(false) // Too short
      expect(validateCode('abcdefghijk')).toBe(false) // Too long
      expect(validateCode('code@123')).toBe(false) // Invalid chars
      expect(validateCode('')).toBe(false)
    })
  })

  describe('validateTeamName', () => {
    it('should accept valid team names', () => {
      expect(validateTeamName('Team A')).toBe(true)
      expect(validateTeamName('My Pokémon Squad')).toBe(true)
    })

    it('should reject invalid team names', () => {
      expect(validateTeamName('A')).toBe(false) // Too short
      expect(validateTeamName('This is a very long team name that exceeds the maximum length limit')).toBe(false)
      expect(validateTeamName('')).toBe(false)
    })
  })

  describe('validateRegisterForm', () => {
    it('should return empty array for valid form', () => {
      const errors = validateRegisterForm(
        'user@example.com',
        'Password123',
        'Password123',
        'John Doe'
      )
      expect(errors).toEqual([])
    })

    it('should return errors for invalid form', () => {
      const errors = validateRegisterForm(
        'invalid-email',
        'weak',
        'Password123',
        'John'
      )
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('email'))).toBe(true)
    })

    it('should detect password mismatch', () => {
      const errors = validateRegisterForm(
        'user@example.com',
        'Password123',
        'DifferentPassword',
        'John Doe'
      )
      expect(errors.some(e => e.includes('coinciden'))).toBe(true)
    })
  })

  describe('validateLoginForm', () => {
    it('should return empty array for valid form', () => {
      const errors = validateLoginForm('user@example.com', 'Password123')
      expect(errors).toEqual([])
    })

    it('should return errors for invalid form', () => {
      const errors = validateLoginForm('invalid', 'weak')
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
