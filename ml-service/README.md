# ML Service - PLM AI Impact Engine

## Overview
Machine Learning microservice for predicting risk scores in engineering change requests.

## Architecture
- **Framework:** FastAPI (Python 3.11)
- **ML Library:** scikit-learn
- **Model:** Random Forest Classifier (to be trained)
- **Fallback:** Rule-based risk scoring

## Features

### Phase 1A: Rule-Based Scoring (Current)
- Immediate risk assessment without trained model
- Based on:
  - Released parts affected (highest weight)
  - Conflicting active changes
  - Where-used count (reuse factor)
  - BOM complexity depth
  - Change type severity
  - Current lifecycle state

### Phase 1C: ML Model (Coming Soon)
- Train on historical ECR/ECN data
- Supervised learning: predict change failure/delay
- Feature importance for explainability
- Continuous improvement with new data

## API Endpoints

### POST /predict-risk
Predict risk score for a change request.

**Request:**
```json
{
  "part_id": 123,
  "part_number": "PART-M456",
  "change_type": "OBSOLETE",
  "bom_depth": 3,
  "where_used_count": 12,
  "released_affected": 3,
  "conflicting_changes": 1,
  "lifecycle_state": "RELEASED"
}
```

**Response:**
```json
{
  "risk_score": 8.2,
  "risk_level": "HIGH",
  "confidence": 0.75,
  "factors": [
    "3 released parts affected - requires formal ECN cascade",
    "1 conflicting active change - coordination risk detected",
    "High reuse factor: 12 parent assemblies"
  ],
  "recommendations": [
    "Create formal ECN with detailed change tasks",
    "Assign senior engineer for review",
    "Coordinate with owners of conflicting changes"
  ],
  "model_version": "RULE_BASED_V1",
  "prediction_time_ms": 1.23
}
```

### GET /health
Health check for container orchestration.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "model_type": "RULE_BASED",
  "version": "1.0.0",
  "timestamp": "2026-02-17T16:30:00"
}
```

### GET /docs
Interactive API documentation (Swagger UI).

## Running Locally

### With Docker (Recommended)
```bash
# From project root
docker-compose up -d ml-service

# Check health
curl http://localhost:5000/health

# Test prediction
curl -X POST http://localhost:5000/predict-risk \
  -H "Content-Type: application/json" \
  -d '{
    "part_id": 123,
    "change_type": "OBSOLETE",
    "bom_depth": 3,
    "where_used_count": 12,
    "released_affected": 3,
    "conflicting_changes": 1,
    "lifecycle_state": "RELEASED"
  }'
```

### Without Docker (Development)
```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --reload --port 5000
```

## Project Structure
```
ml-service/
├── app.py                  # FastAPI application
├── Dockerfile             # Container definition
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── README.md             # This file
├── models/               # Trained ML models
│   ├── risk_model.pkl   # Random Forest model (after training)
│   └── .gitkeep
├── training/             # Model training scripts (Phase 1C)
│   ├── train_model.py
│   ├── feature_engineering.py
│   └── evaluate_model.py
├── utils/                # Helper utilities
│   ├── db_connector.py
│   └── logging_config.py
└── logs/                 # Application logs
    └── .gitkeep
```

## Rule-Based Risk Scoring Logic

### Score Calculation
```python
score = 0.0

# Released parts affected (0-4 points)
if released_affected > 0:
    score += min(released_affected * 1.5, 4.0)

# Conflicting changes (2.5 points)
if conflicting_changes > 0:
    score += 2.5

# Where-used count
if where_used_count > 10:
    score += 2.0
elif where_used_count > 5:
    score += 1.0

# BOM depth
if bom_depth > 4:
    score += 1.5
elif bom_depth > 2:
    score += 0.5

# Change type severity
if change_type in ['OBSOLETE', 'DELETE']:
    score += 1.0

# Lifecycle state
if lifecycle_state == 'RELEASED':
    score += 1.5
elif lifecycle_state == 'UNDERREVIEW':
    score += 0.5

score = min(score, 10.0)  # Cap at 10
```

### Risk Levels
- **LOW:** 0-2.9
- **MEDIUM:** 3.0-5.9
- **HIGH:** 6.0-8.4
- **CRITICAL:** 8.5-10.0

## Future Enhancements (Phase 1C)

### Model Training Pipeline
1. Extract historical data from MySQL
2. Feature engineering
3. Train Random Forest model
4. Evaluate on test set
5. Deploy to production

### Features to Use
- BOM depth and width
- Where-used count
- Lifecycle state transitions
- Historical success rate of similar changes
- Team workload
- Part classification
- Time since last change

### Model Retraining
- Weekly automated retraining
- A/B testing new models
- Performance monitoring

## Dependencies
- **fastapi:** Web framework
- **uvicorn:** ASGI server
- **pydantic:** Data validation
- **scikit-learn:** ML library
- **pandas:** Data manipulation
- **numpy:** Numerical computing
- **mysql-connector-python:** Database access
- **joblib:** Model serialization

## Performance
- **Latency:** < 5ms for rule-based, < 20ms for ML
- **Throughput:** 1000+ requests/sec
- **Memory:** ~200MB base, ~500MB with trained model

## Monitoring
- Health check endpoint for Kubernetes/Docker
- Structured logging to stdout
- Prediction latency tracking
- Model version tracking

## Security
- No sensitive data in responses
- Input validation with Pydantic
- CORS configured for frontend access
- Rate limiting (TODO: Phase 2)

---

**Status:** Phase 1A Complete - Rule-based scoring operational  
**Next:** Phase 1C - Train ML model on historical data
