# AI Impact Engine Implementation

## Overview
Building an **Engineering Impact Reasoning Engine** that provides proactive intelligence for change management in the PLM system.

## Architecture: 3-Layer Hybrid System

### Layer 1: Graph Intelligence (Rule-Based Foundation)
- **Purpose:** Instant structural analysis using existing PLM data
- **Components:**
  - BOM explosion and where-used traversal
  - Lifecycle dependency detection
  - ACL conflict identification
  - Regulatory/classification validation
- **Technology:** Java Spring Boot (existing services)
- **Value:** Zero ML needed, immediate results, explainable

### Layer 2: Risk ML Models (Predictive)
- **Purpose:** Learn from historical patterns to predict change outcomes
- **Models:**
  - Change Risk Classifier: Predicts if ECR will fail/delay
  - Impact Severity Scorer: 0-10 risk score
- **Training Data:** Audit logs, ECR/ECN history, lifecycle transitions
- **Technology:** Python (scikit-learn), FastAPI microservice
- **Value:** Data-driven predictions, improves over time

### Layer 3: LLM Reasoning Layer (Explanation)
- **Purpose:** Convert technical analysis into actionable insights
- **Capabilities:**
  - Natural language explanations of risk factors
  - Answer questions: "Why is this high risk?"
  - Generate recommendations: "Clone instead of revise"
- **Technology:** Ollama (llama3.2) - offline, no API costs
- **Value:** Human-friendly interface, contextual guidance

## Implementation Phases

### ✅ Phase 0: Setup (COMPLETED)
- [x] Create feature branch: `feature/ai-impact-engine`
- [x] Document implementation plan
- [x] Define architecture

### 🚧 Phase 1A: Graph Intelligence APIs (Days 1-3)
- [ ] Create AI package structure in backend
- [ ] Implement GraphAnalysisService (BOM/where-used analysis)
- [ ] Build ImpactAnalyzerService (orchestrator)
- [ ] Add REST API endpoints
- [ ] Unit tests for graph algorithms

### 📋 Phase 1B: ML Microservice (Days 4-6)
- [ ] Create ml-service directory structure
- [ ] Build FastAPI server with health checks
- [ ] Implement rule-based risk scorer (fallback)
- [ ] Add Docker container configuration
- [ ] Integrate with backend via REST
- [ ] Test end-to-end pipeline

### 🎯 Phase 1C: Model Training (Days 7-8)
- [ ] Extract training data from MySQL
- [ ] Feature engineering pipeline
- [ ] Train initial Random Forest model
- [ ] Model evaluation and tuning
- [ ] Deploy trained model to container

### 🎨 Phase 2A: LLM Integration (Days 9-11)
- [ ] Add Ollama container to docker-compose
- [ ] Implement prompt engineering for explanations
- [ ] Create LLM service wrapper in Python
- [ ] Integrate with impact analysis response
- [ ] Test explanation quality

### 💻 Phase 2B: Frontend UI (Days 12-14)
- [ ] Design "Smart Change Panel" component
- [ ] Real-time impact preview widget
- [ ] Risk gauge visualization
- [ ] Affected items tree view
- [ ] Integration with ECR/ECN forms

### 🚀 Phase 3: Advanced Features (Future)
- [ ] Semantic search with embeddings
- [ ] Auto-reviewer suggestion ML model
- [ ] One-click ECN generation with routing
- [ ] Historical trend analysis dashboard

## Technology Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Graph Engine | Java (Spring Boot) | Leverage existing BOM/where-used services |
| ML Models | Python (scikit-learn) | Mature ML ecosystem, easy experimentation |
| ML API | FastAPI | Lightweight, async, easy Docker deployment |
| LLM | Ollama (llama3.2) | Offline, free, good quality for reasoning |
| Vector Store | MySQL (future: pgvector) | Use existing database initially |
| Frontend | React | Existing stack, add AI Copilot panel |
| Orchestration | Docker Compose | Current deployment method |

## Project Structure

```
windchill-plm-app/
├── windchill-backend/
│   └── backend-api/src/main/java/com/windchill/
│       └── ai/                          # NEW AI package
│           ├── controller/
│           │   └── ImpactAnalysisController.java
│           ├── service/
│           │   ├── GraphAnalysisService.java
│           │   ├── ImpactAnalyzerService.java
│           │   └── MLServiceClient.java
│           ├── dto/
│           │   ├── ImpactAnalysisRequest.java
│           │   ├── ImpactAnalysisResponse.java
│           │   └── RiskPredictionResponse.java
│           └── model/
│               └── GraphImpactResult.java
├── ml-service/                          # NEW microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                          # FastAPI server
│   ├── models/
│   │   ├── risk_predictor.py
│   │   └── risk_model.pkl              # Trained model
│   ├── training/
│   │   ├── train_model.py
│   │   └── feature_engineering.py
│   └── utils/
│       └── db_connector.py
└── docker-compose.yml                   # Updated with ml-service
```

## API Design

### POST /api/v1/ai/impact/analyze
**Request:**
```json
{
  "partId": 123,
  "changeType": "OBSOLETE",
  "proposedLifecycleState": "OBSOLETE"
}
```

**Response:**
```json
{
  "partId": 123,
  "partNumber": "PART-X123",
  "affectedParts": [
    {
      "id": 456,
      "number": "ASSEMBLY-ABC",
      "lifecycleState": "RELEASED",
      "relationshipType": "PARENT"
    }
  ],
  "graphMetrics": {
    "bomDepth": 3,
    "whereUsedCount": 12,
    "releasedAffected": 3,
    "conflictingChanges": 1
  },
  "riskAssessment": {
    "score": 7.5,
    "level": "HIGH",
    "confidence": 0.82,
    "factors": [
      "3 released parts affected - requires formal ECN",
      "Part is in active ECN-456 - conflict risk",
      "High reuse: 12 parent assemblies"
    ]
  },
  "recommendations": [
    "Create formal ECN with change tasks for affected assemblies",
    "Assign senior engineer for review",
    "Schedule impact meeting with stakeholders"
  ],
  "explanation": "Part PART-X123 is critical in ASSEMBLY-ABC which is already released. Obsoleting requires cascading ECN to 3 downstream products. Historical data shows similar changes took 14+ days average."
}
```

## Success Metrics

### Technical
- [ ] API response time < 500ms for impact analysis
- [ ] ML model accuracy > 75% on validation set
- [ ] Zero downtime deployment
- [ ] 100% backward compatibility

### Business Value
- [ ] Reduce change failures by 30%+
- [ ] Decrease average ECR review time
- [ ] Improve engineer confidence in change decisions
- [ ] Increase visibility of downstream impacts

## Risk Mitigation

### Safety Measures
1. **Non-Breaking:** All AI features are additive, system works without them
2. **Fallback:** Rule-based risk scoring if ML model unavailable
3. **Isolated:** ML service runs in separate container, can restart independently
4. **Tested:** Comprehensive unit and integration tests
5. **Gradual:** Phase-by-phase rollout with validation at each step

### Rollback Plan
- AI features are behind feature flag (can disable via config)
- Can revert to `feature/worklist-ui` branch instantly
- No database schema changes in Phase 1

## Developer Guide

### Running Locally
```bash
# Start all services including ML
docker-compose up -d --build

# Check ML service health
curl http://localhost:5000/health

# Test impact analysis
curl -X POST http://localhost:8080/api/v1/ai/impact/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"partId": 123, "changeType": "OBSOLETE"}'
```

### Training ML Model
```bash
# Extract training data
docker exec -it windchill-ml-service python training/extract_data.py

# Train model
docker exec -it windchill-ml-service python training/train_model.py

# Restart to load new model
docker-compose restart ml-service
```

## Current Status
**Phase:** 0 - Setup Complete  
**Next:** Implement Graph Intelligence APIs  
**ETA:** Phase 1 complete in 7 days  
**Blockers:** None

## Questions & Decisions

### ✅ Decided
- Architecture: 3-layer hybrid (graph + ML + LLM)
- LLM: Ollama offline-first approach
- ML Framework: scikit-learn (simple, proven)
- Deployment: Docker Compose (consistent with current setup)

### 🤔 To Decide Later
- Model retraining frequency (weekly? monthly?)
- UI placement for AI insights (popup? sidebar? inline?)
- Performance optimization thresholds
- Production monitoring strategy

---

**Last Updated:** 2026-02-17  
**Owner:** Subhash0910  
**Status:** 🚧 In Progress
