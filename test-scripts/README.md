# Phone Number Normalization Testing

This directory contains tests for the phone number normalization implementation that ensures consistent phone number storage and matching between Zillow contacts and Twilio SMS messages.

## Test Files

### 1. `test-phone-normalization.js`
**Unit tests for the phone normalization function**
- Tests various phone formats (Zillow, Twilio, etc.)
- Validates digits-only output format
- Ensures consistent normalization

**Run with:**
```bash
node test-scripts/test-phone-normalization.js
```

### 2. `test-api-endpoints.sh`
**API endpoint tests for webhook functionality**
- Tests Zillow contact creation endpoint
- Tests Twilio webhook processing
- Validates API responses

**Run with:**
```bash
./test-scripts/test-api-endpoints.sh
```

### 3. `integration-test.js`
**End-to-end integration test**
- Creates contact via Zillow webhook with formatted phone number
- Sends SMS via Twilio webhook with different phone format
- Verifies both normalize to same value and match correctly

**Run with:**
```bash
node test-scripts/integration-test.js
```

## Test Scenarios Covered

### Phone Number Formats Tested
| Source | Input Format | Expected Output |
|--------|-------------|----------------|
| Zillow | `"908-244-8429"` | `"9082448429"` |
| Zillow | `"(908) 244-8429"` | `"9082448429"` |
| Twilio | `"+19082448429"` | `"9082448429"` |
| Clean | `"9082448429"` | `"9082448429"` |

### Integration Flow
1. **Zillow Contact Creation**: `"908-244-8429"` → stored as `"9082448429"`
2. **Twilio SMS**: `"+19082448429"` → normalized to `"9082448429"` → **matches existing contact**
3. **Result**: No duplicate contacts, SMS appears in correct conversation

## Prerequisites

- Next.js dev server running on `localhost:3000`
- Database properly configured
- Proper environment variables set

## Running Tests

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Run unit tests:**
   ```bash
   node test-scripts/test-phone-normalization.js
   ```

3. **Run integration test:**
   ```bash
   node test-scripts/integration-test.js
   ```

4. **Check server logs** for normalization output:
   - Look for: `"Normalized phone (digits-only): 9082448429"`
   - Verify contact matching in Twilio webhook logs

## Expected Results

### ✅ Success Indicators
- All unit tests pass (100% success rate)
- Zillow contact creation returns success
- Twilio webhook processes without errors
- Phone numbers stored as digits-only format
- No duplicate contacts created
- SMS messages appear in correct conversations

### ❌ Failure Indicators  
- Phone numbers stored with formatting (dashes, parentheses)
- Duplicate contacts created for same phone number
- Twilio webhook can't find existing Zillow contacts
- API endpoints returning error responses

## Troubleshooting

- **Database connection issues**: Check Supabase configuration
- **Environment variables**: Ensure all required env vars are set
- **Port conflicts**: Make sure port 3000 is available
- **Authentication errors**: Check service role keys and permissions

## Phone Number Normalization Logic

The normalization follows this logic:
1. Remove all non-digit characters (spaces, dashes, parentheses, plus signs)
2. If 11 digits starting with '1', remove the leading '1' 
3. Return 10-digit US phone number format
4. Store and search using this consistent format

This ensures Zillow (`"908-244-8429"`) and Twilio (`"+19082448429"`) phone numbers both normalize to `"9082448429"` for perfect matching.