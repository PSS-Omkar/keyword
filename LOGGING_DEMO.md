# Google Keyword Planner Enhanced Logging Demo

## Request Body Format (As You Requested)

When the keyword generation API is called, you'll see this exact format in your console:

```json
{
  "keywords": ["veterinario roma"],
  "languageId": 1004,
  "locationIds": [2380],
  "keywordCount": 5
}
```

## Complete Console Logging Flow

When keyword generation is triggered, you'll see this comprehensive logging sequence:

### 1. Initial Request Summary
```
🎯 KEYWORD GENERATION REQUEST:
   Topics: veterinario roma
   Country: IT (Location ID: 2380)
   Language: it (Language ID: 1004)
   Max Results: 5
```

### 2. Formatted Request Body (Your Format)
```
🔍 GOOGLE KEYWORD PLANNER REQUEST BODY:
{
  "keywords": ["veterinario roma"],
  "languageId": 1004,
  "locationIds": [2380],
  "keywordCount": 5
}
```

### 3. Google Ads API Request Body
```
📤 GOOGLE ADS API REQUEST BODY:
{
  "keywordSeed": {
    "keywords": ["veterinario roma"]
  },
  "geoTargetConstants": ["geoTargetConstants/2380"],
  "language": "languageConstants/1004",
  "includeAdultKeywords": false,
  "keywordPlanNetwork": "GOOGLE_SEARCH_AND_PARTNERS"
}
```

### 4. Complete API Response
```
📥 GOOGLE KEYWORD PLANNER API Response Status: 200
🔍 COMPLETE GOOGLE KEYWORD PLANNER RESPONSE:
{
  "results": [
    {
      "text": "veterinario roma",
      "keywordIdeaMetrics": {
        "competition": "LOW",
        "monthlySearchVolumes": [
          { "month": "JULY", "year": "2024", "monthlySearches": "2900" },
          // ... more months
        ],
        "avgMonthlySearches": "1900",
        "competitionIndex": "15",
        "lowTopOfPageBidMicros": "25014932",
        "highTopOfPageBidMicros": "123354171"
      },
      "keywordAnnotations": {}
    }
  ],
  "totalSize": 1
}
```

### 5. Individual Keyword Details (Your Format)
```
📊 DETAILED KEYWORD METRICS:

--- Keyword 1: "veterinario roma" ---
{
  "keywordIdeaMetrics": {
    "competition": "LOW",
    "monthlySearchVolumes": [
      {
        "month": "JULY",
        "year": "2024", 
        "monthlySearches": "2900"
      },
      {
        "month": "AUGUST",
        "year": "2024",
        "monthlySearches": "2400"  
      },
      // ... complete 12-month data
    ],
    "avgMonthlySearches": "1900",
    "competitionIndex": "15", 
    "lowTopOfPageBidMicros": "25014932",
    "highTopOfPageBidMicros": "123354171"
  },
  "text": "veterinario roma",
  "keywordAnnotations": {}
}
```

### 6. Processed Response Summary
```
✅ PROCESSED RESPONSE SUMMARY:
{
  "results": [
    {
      "text": "veterinario roma",
      "avgMonthlySearches": 1900,
      "competitionIndex": 15,
      "lowTopOfPageBidMicros": 25014932,
      "highTopOfPageBidMicros": 123354171
    }
  ],
  "nextPageToken": null,
  "totalSize": 1
}
```

## How to Trigger This Logging

The comprehensive logging will be triggered whenever:

1. **Creating a new project** with status "active"
2. **Updating a project** to status "active" 
3. **Any keyword generation request** via the Google Keyword Planner service

The logging shows:
- ✅ Your exact requested format for the request body
- ✅ Complete Google Ads API response with all keyword metrics
- ✅ Individual keyword breakdown matching your sample format
- ✅ Processing summary with final results
- ✅ All bid values in micros format as required by Google Ads API

## Features of Enhanced Logging

1. **Request Body Format**: Shows exactly the format you requested with keywords, languageId, locationIds, and keywordCount
2. **Complete API Response**: Full Google Keyword Planner response including all metadata
3. **Detailed Metrics**: Individual keyword metrics with monthly search volumes, competition data, and bid estimates in micros
4. **Bid Handling**: All bid values stored and displayed in micros format (e.g., 25014932 micros = $25.01)
5. **Error Handling**: Comprehensive error logging for debugging API issues

To see this in action, create or update any project with status "active" - the system will automatically generate keywords and show all this detailed logging in your console!