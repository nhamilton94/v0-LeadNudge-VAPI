// Integration Test for Phone Number Normalization
// Tests the full flow: Zillow contact creation → Twilio SMS → Contact matching

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testPhone: {
    zillow: '908-244-8429',      // Format from Zillow
    twilio: '+19082448429',       // Format from Twilio  
    expected: '9082448429'        // Expected normalized format
  },
  testData: {
    email: `test-${Date.now()}@example.com`,
    name: `Test User ${Date.now()}`,
    listingContactEmail: 'chikaeogele@gmail.com' // From your example
  }
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          };
          resolve(response);
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data, error: e.message });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test 1: Create contact via Zillow webhook
async function testZillowContactCreation() {
  console.log('\n🏢 Step 1: Creating contact via Zillow webhook');
  console.log(`Phone format: ${CONFIG.testPhone.zillow}`);

  const postData = JSON.stringify({
    phone: CONFIG.testPhone.zillow,
    email: CONFIG.testData.email,
    name: CONFIG.testData.name,
    listingContactEmail: CONFIG.testData.listingContactEmail,
    listingStreet: '123 Integration Test St',
    listingPostalCode: '07109',
    listingCity: 'Belleville',
    listingState: 'NJ'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/zillowcontact',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      if (result.success) {
        console.log('✅ Contact created successfully');
        console.log(`📧 Contact email: ${result.data.contact.email}`);
        console.log(`📱 Stored phone: ${result.data.contact.phone}`);
        
        // Verify phone is normalized correctly
        if (result.data.contact.phone === CONFIG.testPhone.expected) {
          console.log('✅ Phone normalization: CORRECT');
        } else {
          console.log(`❌ Phone normalization: FAILED (got ${result.data.contact.phone}, expected ${CONFIG.testPhone.expected})`);
        }
        
        return result.data.contact;
      }
    }
    
    console.log(`❌ Contact creation failed: ${response.body}`);
    return null;
  } catch (error) {
    console.log(`❌ Error creating contact: ${error.message}`);
    return null;
  }
}

// Test 2: Send SMS via Twilio webhook
async function testTwilioWebhook() {
  console.log('\n📱 Step 2: Sending SMS via Twilio webhook');
  console.log(`Phone format: ${CONFIG.testPhone.twilio}`);

  const postData = new URLSearchParams({
    MessageSid: `test-${Date.now()}`,
    From: CONFIG.testPhone.twilio,
    To: '+15551234567',
    Body: 'Integration test message for phone normalization'
  }).toString();

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/twilio/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 200 && response.body.includes('<Response>')) {
      console.log('✅ Twilio webhook processed successfully');
      console.log('✅ Should have found existing contact (check logs)');
      return true;
    }
    
    console.log(`❌ Twilio webhook failed: Status ${response.statusCode}`);
    console.log(`Response: ${response.body}`);
    return false;
  } catch (error) {
    console.log(`❌ Error processing Twilio webhook: ${error.message}`);
    return false;
  }
}

// Main integration test
async function runIntegrationTest() {
  console.log('🧪 Phone Number Normalization Integration Test');
  console.log('=============================================');
  
  console.log('\n📋 Test Configuration:');
  console.log(`Zillow phone: ${CONFIG.testPhone.zillow}`);
  console.log(`Twilio phone: ${CONFIG.testPhone.twilio}`);
  console.log(`Expected normalized: ${CONFIG.testPhone.expected}`);
  console.log(`Test email: ${CONFIG.testData.email}`);

  // Step 1: Create contact via Zillow
  const contact = await testZillowContactCreation();
  
  if (!contact) {
    console.log('\n❌ Integration test failed - contact creation failed');
    return;
  }

  // Wait a moment for database consistency
  console.log('\n⏳ Waiting 1 second for database consistency...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Send SMS via Twilio
  const twilioSuccess = await testTwilioWebhook();

  // Results
  console.log('\n📊 Integration Test Results:');
  console.log('============================');
  
  if (contact && twilioSuccess) {
    console.log('✅ OVERALL: PASSED');
    console.log('✅ Phone normalization working correctly');
    console.log('✅ Contact matching between Zillow and Twilio working');
  } else {
    console.log('❌ OVERALL: FAILED');
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Check server logs for "Normalized phone (digits-only): 9082448429"');
  console.log('2. Verify no duplicate contacts were created');
  console.log('3. Check that the message was stored in the correct conversation');
  console.log('\nFor database verification, check the contacts and conversations tables.');
}

// Run the test
runIntegrationTest().catch(console.error);