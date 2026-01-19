#!/usr/bin/env node

/**
 * Test script for automation enhancement Phase 4 validation
 * Tests conversation state transitions and API endpoints
 */

const fs = require('fs');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_CONTACT_ID = process.env.TEST_CONTACT_ID || '1'; // Replace with actual contact ID

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${details}`);
  }
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 500,
      ok: false,
      error: error.message
    };
  }
}

async function testConversationStateTransitions() {
  console.log('\n🔄 Testing Conversation State Transitions\n');

  // Test 1: Initiate outreach (not_started -> active)
  console.log('Testing: not_started -> active');
  const initiateResponse = await makeRequest('/api/botpress/initiate-outreach', 'POST', {
    contactId: TEST_CONTACT_ID
  });
  
  logTest(
    'Initiate Outreach API', 
    initiateResponse.ok,
    initiateResponse.ok ? `Status: ${initiateResponse.data.conversationStatus}` : initiateResponse.data.error
  );

  // Test 2: Pause conversation (active -> paused)
  console.log('Testing: active -> paused');
  const pauseResponse = await makeRequest('/api/botpress/pause-conversation', 'POST', {
    contactId: TEST_CONTACT_ID,
    reason: 'test_pause'
  });
  
  logTest(
    'Pause Conversation API',
    pauseResponse.ok,
    pauseResponse.ok ? `Status: ${pauseResponse.data.conversationStatus}` : pauseResponse.data.error
  );

  // Test 3: Resume conversation (paused -> active)  
  console.log('Testing: paused -> active');
  const resumeResponse = await makeRequest('/api/botpress/resume-conversation', 'POST', {
    contactId: TEST_CONTACT_ID
  });
  
  logTest(
    'Resume Conversation API',
    resumeResponse.ok,
    resumeResponse.ok ? `Status: ${resumeResponse.data.conversationStatus}` : resumeResponse.data.error
  );

  // Test 4: Duplicate initiate-outreach (should not create duplicate)
  console.log('Testing: duplicate initiate-outreach prevention');
  const duplicateResponse = await makeRequest('/api/botpress/initiate-outreach', 'POST', {
    contactId: TEST_CONTACT_ID
  });
  
  logTest(
    'Duplicate Prevention',
    duplicateResponse.ok && (duplicateResponse.data.message?.includes('already active') || duplicateResponse.data.message?.includes('resumed')),
    duplicateResponse.ok ? duplicateResponse.data.message : duplicateResponse.data.error
  );
}

async function testErrorHandling() {
  console.log('\n🚫 Testing Error Handling\n');

  // Test invalid contact ID
  const invalidContactResponse = await makeRequest('/api/botpress/initiate-outreach', 'POST', {
    contactId: '99999999'
  });
  
  logTest(
    'Invalid Contact ID Handling',
    !invalidContactResponse.ok && invalidContactResponse.status === 404,
    invalidContactResponse.data.error || 'Expected 404 error'
  );

  // Test missing contact ID
  const missingContactResponse = await makeRequest('/api/botpress/initiate-outreach', 'POST', {});
  
  logTest(
    'Missing Contact ID Handling',
    !missingContactResponse.ok && missingContactResponse.status === 400,
    missingContactResponse.data.error || 'Expected 400 error'
  );

  // Test pause non-existent conversation
  const pauseInvalidResponse = await makeRequest('/api/botpress/pause-conversation', 'POST', {
    contactId: '99999999',
    reason: 'test'
  });
  
  logTest(
    'Pause Non-existent Conversation',
    !pauseInvalidResponse.ok,
    pauseInvalidResponse.data.error || 'Expected error for non-existent conversation'
  );
}

async function runAllTests() {
  console.log('🧪 Starting Automation Enhancement Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`👤 Test Contact ID: ${TEST_CONTACT_ID}\n`);

  if (!TEST_CONTACT_ID || TEST_CONTACT_ID === '1') {
    console.log('⚠️  Warning: Using default contact ID. Set TEST_CONTACT_ID environment variable for specific testing.');
  }

  await testConversationStateTransitions();
  await testErrorHandling();

  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.tests.length}\n`);

  if (testResults.failed > 0) {
    console.log('❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
  }

  // Save detailed results
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('📄 Detailed results saved to test-results.json');
}

// Manual test instructions
function printManualTestInstructions() {
  console.log('\n📋 Manual Testing Checklist');
  console.log('============================\n');
  
  const instructions = [
    '1. **New Zillow Contact Test**:',
    '   - Create a new Zillow contact via webhook',
    '   - Verify conversation starts with status "not_started"',
    '   - Verify initiate-outreach is called automatically',
    '   - Check conversation status becomes "active"',
    '',
    '2. **Frontend UI Test**:',
    '   - Open qualification controls in browser',
    '   - Verify status badge shows correct state',
    '   - Test "Start AI Qualification" button',
    '   - Verify button changes to "Pause AI Qualification"',
    '   - Test pause functionality',
    '   - Verify button changes to "Resume AI Qualification"',
    '',
    '3. **Message Forwarding Test**:',
    '   - Send SMS to active conversation → should forward to Botpress',
    '   - Pause conversation via UI',
    '   - Send SMS to paused conversation → should NOT forward to Botpress',
    '   - Resume conversation via UI',
    '   - Send SMS to resumed conversation → should forward to Botpress again',
    '',
    '4. **Database Validation**:',
    '   - Check conversation_status enum values in database',
    '   - Verify last_outreach_attempt timestamps',
    '   - Confirm automation_pause_reason is recorded',
    '',
    '5. **End-to-End Flow**:',
    '   - Complete flow: Zillow contact → automation start → pause → resume',
    '   - Verify no duplicate messages sent to leads',
    '   - Test conversation state persistence across page reloads'
  ];

  instructions.forEach(instruction => console.log(instruction));
}

// Run based on command line arguments
const args = process.argv.slice(2);

if (args.includes('--manual')) {
  printManualTestInstructions();
} else if (args.includes('--help')) {
  console.log('Usage: node test-automation-flow.js [options]');
  console.log('Options:');
  console.log('  --manual    Show manual testing checklist');
  console.log('  --help      Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  TEST_BASE_URL     Base URL for API calls (default: http://localhost:3000)');
  console.log('  TEST_CONTACT_ID   Contact ID to use for testing (default: 1)');
} else {
  // Check if we're in a Node.js environment that supports fetch
  if (typeof fetch === 'undefined') {
    console.log('❌ This script requires Node.js 18+ with fetch support');
    console.log('💡 Alternatively, run with --manual flag to see manual testing checklist');
    process.exit(1);
  }
  
  runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}