# API Documentation

## Authentication

All API endpoints require authentication. Include the authentication token in the request header:
```http
Authorization: Bearer <token>
```

## Analytics Endpoints

### Claims Analytics
`GET /api/v1/analytics/claims`

Query Parameters:
- `startDate` (optional): Start date in ISO format (YYYY-MM-DD)
- `endDate` (optional): End date in ISO format (YYYY-MM-DD)
- `metric` (optional): One of 'totalClaims', 'approvalRate', 'totalAmount'
- `interval` (optional): One of 'day', 'week', 'month'

Response:
```json
{
  "metrics": {
    "totalClaims": number,
    "totalAmount": number,
    "approvalRate": number
  },
  "trends": [
    {
      "period": string,
      "value": number
    }
  ]
}
```

### Patients Analytics
`GET /api/v1/analytics/patients`

Query Parameters:
- `startDate` (optional): Start date in ISO format (YYYY-MM-DD)
- `endDate` (optional): End date in ISO format (YYYY-MM-DD)

Response:
```json
{
  "totalPatients": number,
  "newPatients": number,
  "activePatients": number,
  "demographics": {
    "ageGroups": Record<string, number>,
    "gender": Record<string, number>,
    "location": Record<string, number>
  }
}
```

### Trends Analytics
`GET /api/v1/analytics/trends`

Query Parameters:
- `interval` (optional): One of 'day', 'week', 'month'. Defaults to 'day'

Response:
```json
{
  "patientGrowth": number,
  "revenueGrowth": number,
  "claimsGrowth": number,
  "trends": [
    {
      "period": string,
      "patients": number,
      "claims": number,
      "revenue": number
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid parameters",
  "details": [] // Validation error details
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
``` 