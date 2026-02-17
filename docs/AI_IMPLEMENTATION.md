# AI Impact Engine Implementation

## 🎯 Goal
Build an **Engineering Impact Reasoning Engine** that helps engineers understand the consequences of their changes before they make them.

## 🏗️ Architecture Overview

### Three-Layer Hybrid System

#### Layer 1: Graph Intelligence (Rule-Based)
- **Technology**: Java (Spring Boot)
- **Purpose**: Structural analysis of PLM data
- **Capabilities**:
  - BOM explosion and where-used traversal
  - Lifecycle dependency detection
  - ACL conflict identification
  - Compliance/classification validation

#### Layer 2: Risk ML Models (Predictive)
- **Technology**: Python (scikit-learn/FastAPI)
- **Purpose**: Learn from historical patterns
- **Models**:
  - Change Risk Classifier (predicts if ECR will fail/delay)
  - Impact Severity Scorer (1-10 based on complexity)
- **Training Data**: Audit logs, ECR/ECN history, lifecycle transitions

#### Layer 3: LLM Reasoning (Explanation)
- **Technology**: Ollama (llama3.2) - Offline
- **Purpose**: Natural language explanations
- **Capabilities**:
  - Converts technical analysis into actionable insights
  - Answers questions ("Why is this high risk?")
  - Suggests alternatives with reasoning

## 📋 Implementation Phases

### Phase 1A: Foundation - Graph Intelligence APIs ✅ IN PROGRESS
**Duration**: Days 1-3
**Status**: Setting up core services

**Deliverables**:
- [x] Create feature branch `feature/ai-impact-engine`
- [ ] Java service: `GraphAnalysisService`
- [ ] Java service: `ImpactAnalyzerService`
- [ ] REST API: `/api/v1/ai/impact/analyze`
- [ ] DTOs: Request/Response models

**Success Criteria**:
- API returns affected parts, BOM depth, lifecycle conflicts
- Zero impact on existing ECR/ECN workflow
- All tests pass

### Phase 1B: Python ML Service Container
**Duration**: Days 4-6
**Status**: Pending

**Deliverables**:
- [ ] Python FastAPI service (`ml-service/`)
- [ ] Rule-based risk scoring (fallback)
- [ ] Docker container integration
- [ ] Health check endpoints
- [ ] Java ↔ Python REST communication

**Success Criteria**:
- ML service responds to risk prediction requests
- Returns risk score (0-10), confidence, factors
- Graceful degradation if model not trained

### Phase 1C: Testing & Integration
**Duration**: Day 7
**Status**: Pending

**Deliverables**:
- [ ] End-to-end API tests
- [ ] Docker Compose full stack test
- [ ] Performance benchmarks
- [ ] Documentation updates

### Phase 2: ML Model Training (Week 2)
**Status**: Future

**Deliverables**:
- [ ] Data extraction from MySQL (audit logs, ECR/ECN history)
- [ ] Feature engineering pipeline
- [ ] Train Random Forest classifier
- [ ] Model evaluation (precision, recall, F1)
- [ ] Model deployment to container

### Phase 3: LLM Integration (Week 2-3)
**Status**: Future

**Deliverables**:
- [ ] Ollama container (llama3.2:3b model)
- [ ] Prompt engineering for engineering explanations
- [ ] Context builder (graph + ML results → LLM prompt)
- [ ] Explanation API endpoint

### Phase 4: Frontend UI (Week 3)
**Status**: Future

**Deliverables**:
- [ ] "Smart Change Panel" React component
- [ ] Real-time impact preview (as you type part ID)
- [ ] Risk gauge visualization (1-10 scale)
- [ ] "Explain" button → LLM reasoning
- [ ] Affected items expandable tree

## 🎨 The "Wow" Demo Flow

**User creates new ECR to obsolesce PART-X123:**

1. **Instant feedback** (Layer 1):
   ```
   ⚠️ Impact Detected:
   • 12 assemblies use this part
   • 3 are RELEASED (requires formal ECN)
   • 1 is in active ECN-456 (conflict risk)
   ```

2. **Risk assessment** (Layer 2):
   ```
   🔴 Risk Score: 8.2/10 (HIGH)
   Predicted: 67% chance of delay or rework
   ```

3. **AI explanation** (Layer 3):
   ```
   💡 Why High Risk:
   Part PART-X123 is critical in ASSEMBLY-ABC which is 
   already released. Obsoleting requires cascading ECN 
   to 3 downstream products. Historical data shows 
   similar changes took 14+ days average.
   
   ✅ Recommendation: Create ECN with Change Tasks for 
   ASSEMBLY-ABC, ASSEMBLY-DEF, ASSEMBLY-GHI. Assign to 
   domain expert with 78% success rate.
   ```

4. **One-click action**:
   ```
   [Auto-Create ECN with Smart Routing] button
   → Generates ECN with pre-filled affected items + reviewers
   ```

## 🛡️ Safety Principles

1. **Non-Breaking Changes**: All AI features are additive, system works without them
2. **Graceful Degradation**: If ML service fails, fall back to rule-based scoring
3. **Incremental Rollout**: Test each layer independently before integration
4. **Feature Flags**: AI features can be toggled on/off via config
5. **Audit Trail**: All AI predictions logged for debugging

## 📊 Success Metrics

### Technical
- API response time < 500ms (graph analysis)
- ML prediction time < 200ms
- 99% uptime for ML service
- Zero errors in existing workflows

### Business Value
- Reduce change request failures by 30%+
- Cut average ECR processing time by 20%+
- Improve reviewer assignment accuracy
- Decrease "surprise" impacts in released products

## 🔧 Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Graph Engine** | Java (Spring Boot) | Reuse existing BOM/where-used services |
| **ML Models** | Python (scikit-learn) | Mature ecosystem, easy experimentation |
| **ML API** | FastAPI | Lightweight, async, Docker-friendly |
| **LLM** | Ollama (llama3.2:3b) | Offline, free, good reasoning quality |
| **Vector Store** | MySQL + embeddings table | You already have MySQL |
| **Container** | Docker Compose | Consistent with existing architecture |
| **Frontend** | React (existing) | Add "AI Copilot" panel component |

## 📁 Project Structure

```
windchill-plm-app/
├── windchill-backend/
│   └── backend-api/
│       └── src/main/java/com/windchill/ai/  # NEW
│           ├── controller/
│           │   └── ImpactAnalysisController.java
│           ├── service/
│           │   ├── GraphAnalysisService.java
│           │   └── ImpactAnalyzerService.java
│           ├── dto/
│           │   ├── ImpactAnalysisRequest.java
│           │   ├── ImpactAnalysisResponse.java
│           │   └── RiskPrediction*.java
│           └── config/
│               └── MLServiceConfig.java
│
├── ml-service/                                # NEW
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                    # FastAPI server
│   ├── models/
│   │   ├── risk_predictor.py
│   │   └── .gitkeep
│   ├── training/
│   │   ├── train_model.py
│   │   └── data_loader.py
│   └── tests/
│       └── test_api.py
│
├── windchill-frontend/
│   └── src/components/ai/                     # FUTURE
│       ├── SmartChangePanel.jsx
│       ├── RiskGauge.jsx
│       └── ImpactTree.jsx
│
└── docs/
    ├── AI_IMPLEMENTATION.md          # THIS FILE
    └── AI_API_DOCUMENTATION.md       # FUTURE
```

## 🚀 Current Status

**Date**: February 17, 2026
**Phase**: 1A - Foundation Setup
**Branch**: `feature/ai-impact-engine`
**Next Steps**: Push ML service boilerplate and Java AI services

## 📝 Development Log

### 2026-02-17
- Created feature branch `feature/ai-impact-engine`
- Documented implementation plan
- Designing graph analysis services
- Setting up Python ML service structure

---

## 🤝 Contributing

This is a personal learning project. The AI features are being built incrementally with focus on:
- Clean, maintainable code
- Comprehensive testing
- Clear documentation
- Real-world applicability

## 📚 References

- [PLM AI Trends 2026](https://www.linkedin.com/pulse/top-5-ai-trends-transforming-plm-digital-thread-2026-finocchiaro-zhgve)
- [ML in Manufacturing](https://tech-stack.com/blog/how-machine-learning-is-improving-manufacturing/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
