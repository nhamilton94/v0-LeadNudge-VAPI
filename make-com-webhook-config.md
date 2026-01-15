# Make.com Webhook Configuration for Zillow Integration

## Required Configuration

### Webhook URL
```
https://yourdomain.com/api/zillowcontact
```

### HTTP Method
```
POST
```

### Headers
```
Content-Type: application/json
```

### Required Body Fields
```json
{
  "name": "{{contact_name}}",
  "email": "{{contact_email}}",
  "phone": "{{contact_phone}}",
  "listingContactEmail": "{{your_agent_email}}",
  "listingStreet": "{{property_street}}",
  "listingPostalCode": "{{property_zip}}",
  "listingCity": "{{property_city}}",
  "listingState": "{{property_state}}"
}
```

### Optional Zillow Fields (if available)
```json
{
  "listingUnit": "{{unit_number}}",
  "numBedrooms": "{{bedrooms}}",
  "moveInDate": "{{move_in_date}}",
  "leaseLengthMonths": "{{lease_length}}",
  "leadType": "{{lead_type}}",
  "message": "{{contact_message}}",
  "globalListingId": "{{zillow_listing_id}}"
}
```

## Debugging Steps

1. Check Make.com logs for the exact request being sent
2. Verify the URL is correct (no extra paths or parameters)
3. Ensure listingContactEmail matches an existing user in your database
4. Check your Next.js application logs for the debug output

## Common Issues

- **Wrong URL**: Make sure you're hitting `/api/zillowcontact` exactly
- **Missing Headers**: Content-Type must be `application/json`
- **Invalid listingContactEmail**: Must match a user's email in your profiles table
- **Missing Required Fields**: All fields marked as required must be present