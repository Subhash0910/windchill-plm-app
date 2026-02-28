# AI Impact Engine API Reference

## Base URL

```
http://localhost:8080/api/v1/ai
```

## Authentication

All AI endpoints require bearer token authentication.

```bash
# Get token
TOKEN=$(curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" ...
```

---

## Endpoints

### 1. Analyze Change Impact

**POST** `/api/v1/ai/impact/analyze`

Analyze the impact of a proposed engineering change.

#### Request Body

```json
{
  "partId": 123,
  "changeType": "OBSOLETE",
  "proposedState": "OBSOLETE",
  "description": "Part reaching end of life",
  "userId": 1
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partId` | Long | Yes | ID of part being changed |
| `changeType` | String | Yes | Type of change: `OBSOLETE`, `REVISE`, `PROMOTE`, `DEMOTE` |
| `proposedState` | String | No | Target lifecycle state |
| `description` | String | No | Change description |
| `userId` | Long | No | User requesting analysis |

#### Response

```json
{
  "partId": 123,
  "partNumber": "PART-123",
  "changeType": "OBSOLETE",
  "graphAnalysis": {
    "affectedParts": [
      {
        "partId": 456,
        "partNumber": "ASSEMBLY-456",
        "name": "Main Assembly",
        "lifecycleState": "RELEASED",
        "version": "B.2",
        "relationshipType": "PARENT",
        "isReleased": true,
        "hasActiveChange": false
      }
    ],
    "totalAffectedCount": 12,
    "releasedAffectedCount": 3,
    "underReviewCount": 1,
    "bomDepth": 4,
    "totalBomItems": 28,
    "hasComplexStructure": true,
    "conflictingChangesCount": 1,
    "conflictingChangeNumbers": ["ECN-2024-042"],
    "hasComplianceIssues": false,
    "complianceWarnings": [],
    "currentLifecycleState": "RELEASED",
    "currentVersion": "A.1",
    "structuralComplexity": 7.5
  },
  "riskPrediction": {
    "riskScore": 8.2,
    "confidence": 0.87,
    "riskLevel": "HIGH",
    "factors": [
      "3 released parts require formal ECN process",
      "Conflicts with 1 active change(s)",
      "Widely used component (12 parents)",
      "Deep BOM hierarchy (4 levels)"
    ],
    "modelType": "RULE_BASED",
    "timestamp": "2026-02-17T11:30:00Z"
  },
  "impactSummary": "Risk Level: HIGH (8.2/10). Affects 12 part(s), including 3 released. BOM complexity: 4 levels deep. Conflicts with 1 active change(s).",
  "recommendations": [
    "Create formal ECN with detailed change tasks",
    "Assign senior engineer or domain expert for review",
    "Schedule impact review meeting with stakeholders",
    "Notify all teams owning affected released parts",
    "Coordinate with owners of conflicting changes: ECN-2024-042"
  ],
  "warnings": [
    "3 released part(s) will be affected - requires formal change process",
    "Complex BOM structure detected - review all dependencies carefully"
  ],
  "blockers": [],
  "analyzedAt": "2026-02-17T11:30:00",
  "analyzedBy": 1
}
```

#### Response Fields

**Root Level:**

| Field | Type | Description |
|-------|------|-------------|
| `partId` | Long | Part being analyzed |
| `partNumber` | String | Part number |
| `changeType` | String | Type of change |
| `graphAnalysis` | Object | Structural analysis results |
| `riskPrediction` | Object | ML risk prediction |
| `impactSummary` | String | Human-readable summary |
| `recommendations` | Array<String> | Actionable recommendations |
| `warnings` | Array<String> | Potential issues |
| `blockers` | Array<String> | Issues that must be resolved |
| `analyzedAt` | DateTime | Analysis timestamp |
| `analyzedBy` | Long | User ID who requested |

**graphAnalysis Object:**

| Field | Type | Description |
|-------|------|-------------|
| `affectedParts` | Array<Object> | List of parts impacted |
| `totalAffectedCount` | Integer | Total parts affected |
| `releasedAffectedCount` | Integer | Released parts affected |
| `bomDepth` | Integer | Max BOM hierarchy depth |
| `conflictingChangesCount` | Integer | Number of conflicting active changes |
| `conflictingChangeNumbers` | Array<String> | Conflicting ECR/ECN numbers |
| `hasComplianceIssues` | Boolean | Compliance violations detected |
| `structuralComplexity` | Double | Complexity score 0-10 |

**riskPrediction Object:**

| Field | Type | Description |
|-------|------|-------------|
| `riskScore` | Double | Risk score 0-10 |
| `confidence` | Double | Prediction confidence 0-1 |
| `riskLevel` | String | `LOW`, `MEDIUM`, or `HIGH` |
| `factors` | Array<String> | Contributing risk factors |
| `modelType` | String | `ML`, `RULE_BASED`, or `FALLBACK` |
| `timestamp` | String | Prediction timestamp (ISO 8601) |

#### Status Codes

- `200 OK`: Analysis completed successfully
- `400 Bad Request`: Invalid request (missing partId or changeType)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Part not found
- `500 Internal Server Error`: Analysis failed (check logs)

#### Example Usage

```bash
# Analyze obsolescence impact
curl -X POST http://localhost:8080/api/v1/ai/impact/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "partId": 123,
    "changeType": "OBSOLETE",
    "userId": 1
  }' | jq

# Analyze revision impact
curl -X POST http://localhost:8080/api/v1/ai/impact/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "partId": 456,
    "changeType": "REVISE",
    "proposedState": "UNDERREVIEW",
    "description": "Material change for cost reduction",
    "userId": 1
  }' | jq
```

---

### 2. Health Check

**GET** `/api/v1/ai/impact/health`

Check if AI impact analysis services are operational.

#### Response

```json
"AI Impact Analysis Service is running"
```

#### Status Codes

- `200 OK`: Service is healthy

#### Example

```bash
curl http://localhost:8080/api/v1/ai/impact/health
```

---

## ML Service Direct API

The Python ML service exposes its own API on port 5000.

### Base URL

```
http://localhost:5000
```

### Endpoints

#### 1. Predict Risk

**POST** `/predict-risk`

Direct ML risk prediction (typically called by Java backend, not frontend).

##### Request

```json
{
  "part_id": 123,
  "change_type": "OBSOLETE",
  "bom_depth": 4,
  "where_used_count": 12,
  "released_affected": 3,
  "conflicting_changes": 1,
  "lifecycle_state": "RELEASED",
  "has_compliance_issues": false
}
```

##### Response

```json
{
  "risk_score": 8.2,
  "confidence": 0.87,
  "risk_level": "HIGH",
  "factors": [
    "3 released parts require formal ECN process",
    "Conflicts with 1 active change(s)",
    "Widely used component (12 parents)"
  ],
  "model_type": "RULE_BASED",
  "timestamp": "2026-02-17T11:30:00Z"
}
```

#### 2. ML Service Health

**GET** `/health`

```json
{
  "status": "healthy",
  "model_loaded": false,
  "model_type": "RULE_BASED",
  "timestamp": "2026-02-17T11:30:00Z"
}
```

#### 3. API Documentation

**GET** `/docs`

Interactive Swagger UI for ML service.

---

## Error Responses

### Standard Error Format

```json
{
  "timestamp": "2026-02-17T11:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Part ID is required",
  "path": "/api/v1/ai/impact/analyze"
}
```

### Common Error Scenarios

**Part Not Found (404):**
```json
{
  "error": "Part not found",
  "message": "No part found with ID: 999"
}
```

**ML Service Unavailable (503):**
```json
{
  "error": "Service Unavailable",
  "message": "ML service is temporarily unavailable, using fallback prediction"
}
```

**Validation Error (400):**
```json
{
  "error": "Validation Failed",
  "message": "Invalid change type: INVALID_TYPE",
  "validValues": ["OBSOLETE", "REVISE", "PROMOTE", "DEMOTE"]
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:

- Recommendation: 100 requests/minute per user
- ML service: 50 requests/minute per backend instance

---

## Caching

Prediction results can be cached (configurable):

```properties
ai.fallback.cache-predictions=true
ai.fallback.cache-ttl-seconds=3600
```

Cache key: `impact:analysis:{partId}:{changeType}`

---

## Performance

**Expected response times:**

- Graph analysis: 50-200ms
- ML prediction: 10-50ms
- Total API response: 100-300ms

**Optimization tips:**

1. Cache frequently analyzed parts
2. Batch multiple analyses if possible
3. Use async processing for large BOM explosions
4. Pre-compute where-used relationships

---

## Testing

### Postman Collection

Import this collection:

```json
{
  "info": {
    "name": "PLM AI Impact Engine",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Analyze Impact",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"partId\": 123,\n  \"changeType\": \"OBSOLETE\",\n  \"userId\": 1\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/ai/impact/analyze",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "ai", "impact", "analyze"]
        }
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:8080"}
  ]
}
```

### cURL Test Script

```bash
#!/bin/bash
# test-ai-api.sh

BASE_URL="http://localhost:8080"

echo "Getting auth token..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Testing impact analysis..."
curl -s -X POST "$BASE_URL/api/v1/ai/impact/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "partId": 1,
    "changeType": "OBSOLETE",
    "userId": 1
  }' | jq

echo "\nDone!"
```

---

For more details, see:
- [AI Implementation Plan](./AI_IMPLEMENTATION.md)
- [Integration Guide](./AI_INTEGRATION_GUIDE.md)
