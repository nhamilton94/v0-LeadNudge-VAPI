# API Authentication

This document outlines the authentication requirements for accessing the internal API endpoints.

## Authentication Method

All API requests must include the VAPI_KEY in the request headers:

\`\`\`
VAPI-KEY: your_api_key_here
\`\`\`

## Error Responses

If authentication fails, the API will respond with a 401 Unauthorized status code and a JSON body:

\`\`\`json
{
  "success": false,
  "error": "Authentication failed"
}
\`\`\`

Specific error messages include:
- "API key is required" - No API key was provided in the headers
- "API key configuration error" - The server's API key is not properly configured
- "Invalid API key" - The provided API key does not match the expected value

## API Endpoints

The following endpoints require authentication:

- `POST /api/qualification` - Start, stop, or reset qualification
- `GET /api/qualification` - Get qualification status
- `PATCH /api/qualification` - Update qualification settings
- `POST /api/qualification/call` - Initiate qualification calls
- `GET /api/calendar` - Access calendar events

## Security Considerations

- The API key should be kept secure and not exposed in client-side code
- Rotate the API key periodically for enhanced security
- All API requests should be made over HTTPS
