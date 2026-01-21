// Quick manual test script for phone normalization
// Run with: node test-scripts/test-phone-normalization.js

// Since we can't import TS directly, let's recreate the function for testing
function normalizePhoneNumber(phone) {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // If starts with 1 and has 11 digits, remove the country code (1)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly.substring(1) // Remove leading 1, return 10 digits
  }
  
  // If has 10 digits, it's already in the correct format
  if (digitsOnly.length === 10) {
    return digitsOnly
  }
  
  // For any other case, return as-is (may be international or invalid)
  return digitsOnly
}

// Test cases
const testCases = [
  // Zillow formats
  { input: '908-244-8429', expected: '9082448429', description: 'Zillow dash format' },
  { input: '(908) 244-8429', expected: '9082448429', description: 'Zillow parentheses format' },
  { input: '908.244.8429', expected: '9082448429', description: 'Zillow dot format' },
  
  // Twilio format
  { input: '+19082448429', expected: '9082448429', description: 'Twilio +1 format' },
  { input: '19082448429', expected: '9082448429', description: '11-digit with country code' },
  
  // Already clean
  { input: '9082448429', expected: '9082448429', description: '10-digit clean format' },
  
  // Edge cases
  { input: '', expected: '', description: 'Empty string' },
  { input: ' (908) 244-8429 ', expected: '9082448429', description: 'With whitespace' },
]

console.log('🧪 Testing Phone Normalization Function\n')

let passed = 0
let failed = 0

testCases.forEach(({ input, expected, description }, index) => {
  const result = normalizePhoneNumber(input)
  const success = result === expected
  
  console.log(`Test ${index + 1}: ${description}`)
  console.log(`  Input:    "${input}"`)
  console.log(`  Expected: "${expected}"`)
  console.log(`  Result:   "${result}"`)
  console.log(`  Status:   ${success ? '✅ PASS' : '❌ FAIL'}\n`)
  
  if (success) {
    passed++
  } else {
    failed++
  }
})

console.log('📊 Test Summary:')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

if (failed === 0) {
  console.log('\n🎉 All tests passed! Phone normalization is working correctly.')
} else {
  console.log('\n⚠️  Some tests failed. Please check the implementation.')
}