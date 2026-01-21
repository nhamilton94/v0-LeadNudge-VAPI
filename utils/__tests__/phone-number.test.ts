import { normalizePhoneNumber, getPhoneSearchVariants } from '../phone-number'

describe('normalizePhoneNumber', () => {
  it('should handle Zillow formats with dashes and parentheses', () => {
    expect(normalizePhoneNumber('908-244-8429')).toBe('9082448429')
    expect(normalizePhoneNumber('(908) 244-8429')).toBe('9082448429')
    expect(normalizePhoneNumber('(908)244-8429')).toBe('9082448429')
    expect(normalizePhoneNumber('908.244.8429')).toBe('9082448429')
  })

  it('should handle Twilio format with +1 country code', () => {
    expect(normalizePhoneNumber('+19082448429')).toBe('9082448429')
    expect(normalizePhoneNumber('19082448429')).toBe('9082448429')
  })

  it('should handle already clean 10-digit numbers', () => {
    expect(normalizePhoneNumber('9082448429')).toBe('9082448429')
  })

  it('should handle various whitespace and formatting', () => {
    expect(normalizePhoneNumber(' (908) 244-8429 ')).toBe('9082448429')
    expect(normalizePhoneNumber('908 244 8429')).toBe('9082448429')
    expect(normalizePhoneNumber('+1 908 244 8429')).toBe('9082448429')
  })

  it('should handle empty and invalid inputs', () => {
    expect(normalizePhoneNumber('')).toBe('')
    expect(normalizePhoneNumber('abc')).toBe('')
    expect(normalizePhoneNumber('123')).toBe('123') // Too short but return digits
  })

  it('should handle edge cases', () => {
    // International numbers longer than 11 digits - return as digits
    expect(normalizePhoneNumber('+441234567890')).toBe('441234567890')
    
    // Numbers with extra digits
    expect(normalizePhoneNumber('19082448429123')).toBe('19082448429123')
  })

  it('should match the Zillow example from the conversation', () => {
    // This is the actual example from Zillow response
    expect(normalizePhoneNumber('908-244-8429')).toBe('9082448429')
  })

  it('should match expected Twilio format', () => {
    // This is the expected Twilio format based on research
    expect(normalizePhoneNumber('+19082448429')).toBe('9082448429')
  })
})

describe('getPhoneSearchVariants', () => {
  it('should return normalized phone number for search', () => {
    expect(getPhoneSearchVariants('908-244-8429')).toEqual(['9082448429'])
    expect(getPhoneSearchVariants('+19082448429')).toEqual(['9082448429'])
  })

  it('should return empty array for invalid input', () => {
    expect(getPhoneSearchVariants('')).toEqual([])
    expect(getPhoneSearchVariants('abc')).toEqual([])
  })
})

// Integration test scenarios
describe('Phone Normalization Integration Scenarios', () => {
  it('should ensure Zillow and Twilio formats normalize to same value', () => {
    const zillowPhone = '908-244-8429'           // From Zillow webhook
    const twilioPhone = '+19082448429'           // From Twilio webhook
    
    const normalizedZillow = normalizePhoneNumber(zillowPhone)
    const normalizedTwilio = normalizePhoneNumber(twilioPhone)
    
    expect(normalizedZillow).toBe(normalizedTwilio)
    expect(normalizedZillow).toBe('9082448429')
  })

  it('should handle various US phone formats consistently', () => {
    const phoneFormats = [
      '(908) 244-8429',
      '908-244-8429', 
      '908.244.8429',
      '908 244 8429',
      '+19082448429',
      '19082448429',
      '9082448429'
    ]

    const normalized = phoneFormats.map(normalizePhoneNumber)
    
    // All should normalize to the same value
    normalized.forEach(phone => {
      expect(phone).toBe('9082448429')
    })
  })
})