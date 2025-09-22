# Traffid Projects API Documentation

## Authentication
All external API endpoints require an API key for authentication. Include the API key in one of the following ways:

- **Header**: `x-api-key: traffid-api-key-2025`
- **Query Parameter**: `?apiKey=traffid-api-key-2025`
- **Request Body**: `{ "apiKey": "traffid-api-key-2025" }`

## Available Endpoints

### 1. Get All Projects
Retrieve all projects in the system.

**Endpoint**: `GET /api/external/projects`

**Example Request**:
```bash
curl -X GET "https://your-domain/api/external/projects" \
  -H "x-api-key: traffid-api-key-2025"
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Sedo education",
    "topics": ["online marketing", "seo"],
    "countries": ["US", "CA"],
    "languages": ["en"],
    "userId": "40120401",
    "createdAt": "2025-01-07T19:43:18.000Z",
    "updatedAt": "2025-01-07T19:43:18.000Z"
  }
]
```

### 2. Get Specific Project with Campaigns
Retrieve a specific project including all its campaigns.

**Endpoint**: `GET /api/external/projects/:id`

**Example Request**:
```bash
curl -X GET "https://your-domain/api/external/projects/1" \
  -H "x-api-key: traffid-api-key-2025"
```

**Response**:
```json
{
  "id": 1,
  "name": "Sedo education",
  "topics": ["online marketing", "seo"],
  "countries": ["US", "CA"],
  "languages": ["en"],
  "userId": "40120401",
  "createdAt": "2025-01-07T19:43:18.000Z",
  "updatedAt": "2025-01-07T19:43:18.000Z",
  "campaigns": [
    {
      "id": 1,
      "projectId": 1,
      "keyword": "online marketing",
      "url": "https://example.com/marketing",
      "channelId": "sedo_001",
      "status": "active",
      "createdAt": "2025-01-07T19:49:44.000Z",
      "updatedAt": "2025-01-07T19:49:44.000Z"
    }
  ]
}
```

### 3. Get Project Campaigns Only
Retrieve only the campaigns for a specific project.

**Endpoint**: `GET /api/external/projects/:id/campaigns`

**Example Request**:
```bash
curl -X GET "https://your-domain/api/external/projects/1/campaigns" \
  -H "x-api-key: traffid-api-key-2025"
```

**Response**:
```json
[
  {
    "id": 1,
    "projectId": 1,
    "keyword": "online marketing",
    "url": "https://example.com/marketing",
    "channelId": "sedo_001",
    "status": "active",
    "createdAt": "2025-01-07T19:49:44.000Z",
    "updatedAt": "2025-01-07T19:49:44.000Z"
  }
]
```

### 4. Get All Advertisers
Retrieve all advertisers with their channel IDs and domains.

**Endpoint**: `GET /api/external/advertisers`

**Example Request**:
```bash
curl -X GET "https://your-domain/api/external/advertisers" \
  -H "x-api-key: traffid-api-key-2025"
```

**Response**:
```json
[
  {
    "id": 2,
    "name": "Explorads",
    "channelIds": ["sedo_001", "sedo_002", "sedo_003"],
    "domains": ["explorads.com", "marketing.example.com"],
    "sampleUrl": "https://explorads.com/sample",
    "createdAt": "2025-01-07T19:43:18.000Z",
    "updatedAt": "2025-01-07T19:43:18.000Z"
  }
]
```

### 5. Get Project Statistics
Retrieve overall statistics for all projects.

**Endpoint**: `GET /api/external/stats`

**Example Request**:
```bash
curl -X GET "https://your-domain/api/external/stats" \
  -H "x-api-key: traffid-api-key-2025"
```

**Response**:
```json
{
  "totalProjects": 1,
  "activeCampaigns": 1,
  "advertisers": 1,
  "countries": 2
}
```

### 6. Create Campaigns (Bulk)
Create multiple campaigns for a specific project.

**Endpoint**: `POST /api/campaigns/create`

**Request Body**:
```json
{
  "projectId": 1,
  "campaigns": [
    {
      "keyword": "digital marketing",
      "url": "https://example.com/digital",
      "channelId": "sedo_004",
      "status": "draft",
      "trafficSource": "Google",
      "primaryText": "Best digital marketing solutions",
      "headline": "Transform Your Business",
      "description": "Professional digital marketing services",
      "cta": "Get Started",
      "image": "https://example.com/marketing.jpg",
      "video": "https://example.com/demo.mp4"
    },
    {
      "keyword": "seo tools",
      "url": "https://example.com/seo",
      "channelId": "sedo_005",
      "status": "active",
      "trafficSource": "Facebook",
      "headline": "SEO Tools 2025",
      "cta": "Learn More"
    }
  ]
}
```

**Example Request**:
```bash
curl -X POST "https://your-domain/api/campaigns/create" \
  -H "x-api-key: traffid-api-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "campaigns": [
      {
        "keyword": "digital marketing",
        "url": "https://example.com/digital",
        "channelId": "sedo_004",
        "status": "draft"
      }
    ]
  }'
```

**Response**:
```json
{
  "created": 1,
  "total": 1,
  "errors": []
}
```

## Error Responses

### Authentication Error
```json
{
  "message": "Invalid or missing API key"
}
```

### Not Found Error
```json
{
  "message": "Project not found"
}
```

### Validation Error
```json
{
  "message": "Invalid request format"
}
```

### Server Error
```json
{
  "message": "Failed to fetch projects"
}
```

## Campaign Status Values
- `draft`: Campaign is being prepared
- `active`: Campaign is currently running
- `paused`: Campaign is temporarily stopped
- `completed`: Campaign has finished

## Rate Limiting
Currently no rate limiting is implemented, but it's recommended to limit requests to avoid overwhelming the server.

## Notes
- All timestamps are in ISO 8601 format (UTC)
- Project IDs and Campaign IDs are integers
- Channel IDs should match those available for the project's associated advertiser
- URLs should include the protocol (https://)