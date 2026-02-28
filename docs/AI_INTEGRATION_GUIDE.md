# AI Impact Engine Integration Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git repository cloned
- On branch `feature/ai-impact-engine`

### Step 1: Build and Start Services

```bash
# From project root
cd windchill-plm-app

# Build and start all services (including new ML service)
docker-compose up -d --build

# Check all services are healthy
docker-compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
windchill-mysql         Up (healthy)        3306
windchill-redis         Up (healthy)        6379
windchill-ml-service    Up (healthy)        5000
windchill-backend       Up (healthy)        8080
windchill-frontend      Up (healthy)        80
```

### Step 2: Verify ML Service

```bash
# Test ML service health
curl http://localhost:5000/health

# Expected response:
# {"status":"healthy","model_loaded":false,"model_type":"RULE_BASED","timestamp":"..."}
```

### Step 3: Test Impact Analysis API

```bash
# Get authentication token first
TOKEN=$(curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Test impact analysis
curl -X POST http://localhost:8080/api/v1/ai/impact/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "partId": 1,
    "changeType": "OBSOLETE",
    "userId": 1
  }' | jq
```

## 🔧 Integration with Existing Services

### Step 1: Wire GraphAnalysisService to Your Existing Services

Update `GraphAnalysisService.java` to use your actual services:

```java
@Autowired private PartService partService;
@Autowired private BomService bomService;
@Autowired private WhereUsedService whereUsedService;
@Autowired private ChangeService changeService;

public GraphImpactResult analyzePartChange(Long partId, String changeType) {
    // Step 1: Get current part
    Part part = partService.findById(partId)
        .orElseThrow(() -> new PartNotFoundException(partId));

    // Step 2: Get where-used (parent assemblies)
    List<Part> parentAssemblies = whereUsedService.getAllParentAssemblies(partId);
    
    List<AffectedPartInfo> affectedParts = parentAssemblies.stream()
        .map(p -> AffectedPartInfo.builder()
            .partId(p.getId())
            .partNumber(p.getNumber())
            .name(p.getName())
            .lifecycleState(p.getLifecycleState())
            .version(p.getVersion())
            .isReleased("RELEASED".equals(p.getLifecycleState()))
            .hasActiveChange(changeService.hasActiveChange(p.getId()))
            .relationshipType("PARENT")
            .build())
        .collect(Collectors.toList());

    // Step 3: Explode BOM
    BomTree bomTree = bomService.explodeBom(partId, 5);
    
    // Continue with analysis...
}
```

### Step 2: Add AI Impact Analysis to ECR Creation Flow

In your ECR creation controller/service:

```java
@Autowired
private ImpactAnalyzerService impactAnalyzerService;

@PostMapping("/ecr/create")
public ResponseEntity<EcrResponse> createEcr(@RequestBody EcrRequest request) {
    
    // Before creating ECR, analyze impact
    if (aiEnabled) {
        ImpactAnalysisRequest analysisRequest = ImpactAnalysisRequest.builder()
            .partId(request.getPartId())
            .changeType(request.getChangeType())
            .userId(getCurrentUserId())
            .build();
            
        ImpactAnalysisResponse analysis = impactAnalyzerService.analyzeChange(analysisRequest);
        
        // Log AI insights
        log.info("AI Impact Analysis: {}", analysis.getImpactSummary());
        log.info("Risk Level: {} ({})", 
            analysis.getRiskPrediction().getRiskLevel(),
            analysis.getRiskPrediction().getRiskScore());
        
        // Optionally block high-risk changes
        if ("HIGH".equals(analysis.getRiskPrediction().getRiskLevel()) 
            && !analysis.getBlockers().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Cannot proceed: " + analysis.getBlockers()));
        }
    }
    
    // Proceed with ECR creation
    // ...
}
```

### Step 3: Add Impact Preview in Frontend (React)

Create `src/components/ai/ImpactPreview.jsx`:

```jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';

export const ImpactPreview = ({ partId, changeType }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partId && changeType) {
      analyzeImpact();
    }
  }, [partId, changeType]);

  const analyzeImpact = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/impact/analyze', {
        partId,
        changeType,
        userId: getCurrentUserId()
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Impact analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Analyzing impact...</div>;
  if (!analysis) return null;

  const risk = analysis.riskPrediction;
  const riskColor = 
    risk.riskLevel === 'HIGH' ? 'red' : 
    risk.riskLevel === 'MEDIUM' ? 'orange' : 'green';

  return (
    <div className="impact-preview">
      <h3>⚡ AI Impact Analysis</h3>
      
      <div className="risk-score" style={{ color: riskColor }}>
        <strong>Risk: {risk.riskLevel}</strong>
        <span>({risk.riskScore}/10)</span>
      </div>

      {analysis.warnings.length > 0 && (
        <div className="warnings">
          <h4>⚠️ Warnings</h4>
          <ul>
            {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="recommendations">
        <h4>💡 Recommendations</h4>
        <ul>
          {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>

      <div className="impact-details">
        <p>
          Affects <strong>{analysis.graphAnalysis.totalAffectedCount}</strong> parts, 
          including <strong>{analysis.graphAnalysis.releasedAffectedCount}</strong> released.
        </p>
      </div>
    </div>
  );
};
```

Use in your ECR form:

```jsx
import { ImpactPreview } from './ai/ImpactPreview';

function EcrForm() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [changeType, setChangeType] = useState('OBSOLETE');

  return (
    <form>
      <PartSelector onChange={setSelectedPart} />
      <ChangeTypeSelector onChange={setChangeType} />
      
      {/* AI Impact Preview */}
      {selectedPart && (
        <ImpactPreview 
          partId={selectedPart.id} 
          changeType={changeType} 
        />
      )}
      
      <button type="submit">Create ECR</button>
    </form>
  );
}
```

## 📊 Monitoring & Debugging

### View ML Service Logs
```bash
docker logs -f windchill-ml-service
```

### View Backend AI Logs
```bash
docker logs -f windchill-backend | grep "com.windchill.ai"
```

### Interactive API Testing
Visit Swagger UI:
- Backend API: http://localhost:8080/swagger-ui.html
- ML Service: http://localhost:5000/docs

### Database Inspection
```bash
# Connect to MySQL
docker exec -it windchill-mysql mysql -uwindchill -pwindchill123 windchill_db

# Check parts data
SELECT id, number, name, lifecycle_state FROM parts LIMIT 10;

# Check change requests
SELECT id, title, status, risk_score FROM change_requests ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Troubleshooting

### Issue: ML Service Not Starting

**Symptoms:**
```
windchill-ml-service    Exited (1)
```

**Solution:**
```bash
# Check logs
docker logs windchill-ml-service

# Common fixes:
# 1. Port 5000 already in use
sudo lsof -i :5000  # Find and kill conflicting process

# 2. Python dependency issues
docker-compose build --no-cache ml-service
```

### Issue: Backend Can't Connect to ML Service

**Symptoms:**
```
java.net.ConnectException: Connection refused
```

**Solution:**
```bash
# 1. Verify ML service is healthy
curl http://localhost:5000/health

# 2. Check Docker network
docker network inspect windchill-plm-app_windchill-network

# 3. Test from inside backend container
docker exec windchill-backend curl http://ml-service:5000/health
```

### Issue: Analysis Returns Empty Results

**Symptoms:**
API returns 200 but `affectedParts` is empty.

**Root Cause:**
`GraphAnalysisService` is using placeholder logic (TODOs not implemented).

**Solution:**
Integrate with your actual services:
1. Wire up `PartService`, `BomService`, `WhereUsedService`
2. Replace mock data with real database queries
3. See "Integration with Existing Services" section above

## 📝 Configuration Reference

### application-ai.properties

All AI-related settings are in `application-ai.properties`.

Key settings:

```properties
# Enable/disable AI features
ai.impact-analysis.enabled=true
ai.risk-prediction.enabled=true

# ML service connection
ml.service.url=http://ml-service:5000
ml.service.enabled=true
ml.service.timeout=5000

# Risk thresholds
ai.risk.high-threshold=7.0
ai.risk.medium-threshold=4.0

# Fallback behavior
ai.fallback.use-rule-based=true
```

### Environment Variables

**Backend (Java):**
- `ML_SERVICE_URL`: ML service endpoint (default: `http://ml-service:5000`)
- `ML_SERVICE_ENABLED`: Enable/disable ML integration (default: `true`)

**ML Service (Python):**
- `MODEL_PATH`: Path to trained model (default: `models/risk_model.pkl`)
- `DB_HOST`, `DB_PORT`, `DB_NAME`: MySQL connection for future data extraction
- `LOG_LEVEL`: Logging level (default: `INFO`)

## 🎯 Next Steps

### Immediate (Week 1)
1. ✅ Deploy and test the foundation
2. ☐ Integrate `GraphAnalysisService` with your existing services
3. ☐ Test with real PLM data
4. ☐ Add frontend impact preview component

### Short-term (Week 2)
1. ☐ Extract historical data from MySQL for model training
2. ☐ Train initial ML risk model
3. ☐ Replace rule-based with ML predictions
4. ☐ A/B test model accuracy

### Long-term (Week 3-4)
1. ☐ Add LLM reasoning layer (Ollama integration)
2. ☐ Semantic search for parts
3. ☐ Auto-reviewer suggestion
4. ☐ Smart change routing

## 📚 Resources

- [AI Implementation Plan](./AI_IMPLEMENTATION.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Spring Boot RestTemplate](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

**Questions or issues?**  
Check the main [AI_IMPLEMENTATION.md](./AI_IMPLEMENTATION.md) or review Docker logs.
