# ML Service for Windchill PLM

## Overview
FastAPI-based machine learning service for engineering change impact prediction and risk scoring.

## Features
- **Risk Prediction**: Scores change requests on 0-10 scale
- **Rule-Based Fallback**: Works without trained model
- **RESTful API**: Easy integration with Java backend
- **Health Checks**: Docker-ready monitoring

## Quick Start

### Local Development
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app:app --reload --port 5000
```

### Docker
```bash
docker build -t plm-ml-service .
docker run -p 5000:5000 plm-ml-service
```

### API Documentation
Once running, visit:
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## API Endpoints

### POST /predict-risk
Predict risk score for an engineering change.

**Request:**
```json
{
  "part_id": 123,
  "change_type": "OBSOLETE",
  "bom_depth": 4,
  "where_used_count": 8,
  "released_affected": 3,
  "conflicting_changes": 1,
  "lifecycle_state": "RELEASED",
  "has_compliance_issues": false
}
```

**Response:**
```json
{
  "risk_score": 8.2,
  "confidence": 0.87,
  "risk_level": "HIGH",
  "factors": [
    "3 released parts require formal ECN process",
    "Conflicts with 1 active change(s)",
    "Widely used component (8 parents)"
  ],
  "model_type": "RULE_BASED",
  "timestamp": "2026-02-17T11:20:00Z"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "model_type": "RULE_BASED",
  "timestamp": "2026-02-17T11:20:00Z"
}
```

## Model Training

TODO: Add training pipeline once we have sufficient historical data.

## Environment Variables

- `MODEL_PATH`: Path to trained model file (default: `models/risk_model.pkl`)
- `DB_HOST`: MySQL host (for future data extraction)
- `DB_PORT`: MySQL port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password

## Development Status

- [x] FastAPI server setup
- [x] Rule-based risk scoring
- [x] Docker containerization
- [x] Health check endpoint
- [ ] ML model training pipeline
- [ ] Model serving with trained classifier
- [ ] Data extraction from MySQL
- [ ] Feature engineering improvements
- [ ] Unit tests
- [ ] Integration tests