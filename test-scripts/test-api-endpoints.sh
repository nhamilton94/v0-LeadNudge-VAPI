#!/bin/bash

# API Endpoint Testing Script for Phone Number Normalization
# This script tests both Zillow and Twilio webhooks to ensure phone number normalization works

echo "🧪 API Endpoint Testing for Phone Number Normalization"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
TEST_PHONE_ZILLOW="908-244-8429"
TEST_PHONE_TWILIO="+19082448429"
EXPECTED_NORMALIZED="9082448429"

echo -e "\n${BLUE}📋 Test Configuration:${NC}"
echo "Base URL: $BASE_URL"
echo "Zillow Phone Format: $TEST_PHONE_ZILLOW"
echo "Twilio Phone Format: $TEST_PHONE_TWILIO"
echo "Expected Normalized: $EXPECTED_NORMALIZED"

# Test 1: Zillow Contact Creation
echo -e "\n${BLUE}🏢 Test 1: Zillow Contact Creation${NC}"
echo "Testing POST /api/zillowcontact with phone: $TEST_PHONE_ZILLOW"

ZILLOW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/zillowcontact" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$TEST_PHONE_ZILLOW\",
    \"email\": \"test@example.com\", 
    \"name\": \"Test User Phone Normalization\",
    \"listingContactEmail\": \"chikaeogele@gmail.com\",
    \"listingStreet\": \"123 Phone Test St\",
    \"listingPostalCode\": \"07109\",
    \"listingCity\": \"Belleville\",  
    \"listingState\": \"NJ\"
  }")

echo "Response: $ZILLOW_RESPONSE"

# Check if contact was created successfully
if echo "$ZILLOW_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✅ Zillow contact creation: PASSED${NC}"
  CONTACT_ID=$(echo "$ZILLOW_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Contact ID: $CONTACT_ID"
else
  echo -e "${RED}❌ Zillow contact creation: FAILED${NC}"
fi

# Test 2: Twilio Webhook
echo -e "\n${BLUE}📱 Test 2: Twilio Webhook${NC}"
echo "Testing POST /api/twilio/webhook with phone: $TEST_PHONE_TWILIO"

TWILIO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/twilio/webhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test123&From=$TEST_PHONE_TWILIO&To=%2B15551234567&Body=Hello+this+is+a+test+message")

echo "Response: $TWILIO_RESPONSE"

# Check if webhook processed successfully (should return TwiML)
if echo "$TWILIO_RESPONSE" | grep -q "<Response>"; then
  echo -e "${GREEN}✅ Twilio webhook processing: PASSED${NC}"
else
  echo -e "${RED}❌ Twilio webhook processing: FAILED${NC}"
fi

# Test 3: Database Verification
echo -e "\n${BLUE}🗄️  Test 3: Phone Format Verification${NC}"
echo "This would require database access to verify that:"
echo "1. Zillow contact stored phone as: $EXPECTED_NORMALIZED"
echo "2. Twilio webhook found existing contact (no duplicate created)"
echo -e "${BLUE}ℹ️  Check the server logs to verify normalization is working${NC}"

# Test 4: Integration Flow Test
echo -e "\n${BLUE}🔄 Test 4: Integration Flow Summary${NC}"
echo "Manual verification steps:"
echo "1. Check server logs for 'Normalized phone (digits-only): $EXPECTED_NORMALIZED'"
echo "2. Verify no duplicate contacts were created"
echo "3. Confirm message appears in correct conversation"

echo -e "\n${BLUE}📊 Testing Complete${NC}"
echo "Check the server console logs for detailed normalization output"