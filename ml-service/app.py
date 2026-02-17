"""FastAPI ML Service for PLM AI Impact Engine.

Provides risk prediction and analysis for engineering change requests.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import joblib
import numpy as np
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PLM AI Service",
    description="Machine Learning service for Engineering Impact Analysis",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained model (will be None initially, use rule-based fallback)
MODEL_PATH = "models/risk_model.pkl"
trained_model = None

try:
    if os.path.exists(MODEL_PATH):
        trained_model = joblib.load(MODEL_PATH)
        logger.info("Trained ML model loaded successfully")
    else:
        logger.warning(f"No trained model found at {MODEL_PATH}, using rule-based fallback")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    trained_model = None

# ==================== Request/Response Models ====================

class RiskPredictionRequest(BaseModel):
    """Request model for risk prediction."""
    part_id: int = Field(..., description="ID of the part being changed")
    part_number: Optional[str] = Field(None, description="Part number (optional)")
    change_type: str = Field(..., description="Type of change: REVISE, OBSOLETE, etc.")
    
    # Graph metrics from Java backend
    bom_depth: int = Field(0, ge=0, description="Maximum BOM depth")
    where_used_count: int = Field(0, ge=0, description="Number of parent assemblies")
    released_affected: int = Field(0, ge=0, description="Number of released parts affected")
    conflicting_changes: int = Field(0, ge=0, description="Number of conflicting active changes")
    
    # Part metadata
    lifecycle_state: str = Field(..., description="Current lifecycle state")
    classification: Optional[str] = Field(None, description="Part classification")
    
    # Context
    user_id: Optional[int] = Field(None, description="User making the change")
    context_id: Optional[int] = Field(None, description="Context/container ID")

    class Config:
        json_schema_extra = {
            "example": {
                "part_id": 123,
                "part_number": "PART-M456",
                "change_type": "OBSOLETE",
                "bom_depth": 3,
                "where_used_count": 12,
                "released_affected": 3,
                "conflicting_changes": 1,
                "lifecycle_state": "RELEASED",
                "classification": "ELECTRICAL"
            }
        }

class RiskPredictionResponse(BaseModel):
    """Response model for risk prediction."""
    risk_score: float = Field(..., ge=0, le=10, description="Risk score from 0 (safe) to 10 (critical)")
    risk_level: str = Field(..., description="Risk category: LOW, MEDIUM, HIGH, CRITICAL")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    factors: List[str] = Field(..., description="List of risk factors identified")
    recommendations: List[str] = Field(default_factory=list, description="Suggested actions")
    model_version: str = Field(..., description="Model type used: ML or RULE_BASED")
    prediction_time_ms: float = Field(..., description="Prediction latency in milliseconds")

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_type: str
    version: str
    timestamp: str

# ==================== Helper Functions ====================

def get_risk_level(score: float) -> str:
    """Convert numeric risk score to categorical level."""
    if score < 3.0:
        return "LOW"
    elif score < 6.0:
        return "MEDIUM"
    elif score < 8.5:
        return "HIGH"
    else:
        return "CRITICAL"

def generate_recommendations(risk_level: str, factors: List[str], change_type: str) -> List[str]:
    """Generate actionable recommendations based on risk assessment."""
    recommendations = []
    
    if risk_level == "CRITICAL" or risk_level == "HIGH":
        recommendations.append("Create formal ECN with detailed change tasks")
        recommendations.append("Assign senior engineer or domain expert for review")
        recommendations.append("Schedule impact assessment meeting with stakeholders")
        
        if "conflicting" in " ".join(factors).lower():
            recommendations.append("Coordinate with owners of conflicting changes before proceeding")
        
        if "released" in " ".join(factors).lower():
            recommendations.append("Plan cascading ECN for all affected released assemblies")
    
    elif risk_level == "MEDIUM":
        recommendations.append("Document affected assemblies in ECR description")
        recommendations.append("Request peer review from team member")
        recommendations.append("Verify no active production orders use affected parts")
    
    elif risk_level == "LOW":
        recommendations.append("Standard review process is sufficient")
        recommendations.append("Proceed with confidence")
    
    return recommendations

# ==================== Rule-Based Fallback Logic ====================

def rule_based_risk_prediction(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """Rule-based risk scoring when ML model is unavailable.
    
    This provides immediate value even before model training.
    """
    start_time = datetime.now()
    score = 0.0
    factors = []
    
    # Factor 1: Released parts affected (highest risk)
    if request.released_affected > 0:
        weight = min(request.released_affected * 1.5, 4.0)
        score += weight
        factors.append(
            f"{request.released_affected} released part{'s' if request.released_affected > 1 else ''} "
            f"affected - requires formal ECN cascade"
        )
    
    # Factor 2: Conflicting changes
    if request.conflicting_changes > 0:
        score += 2.5
        factors.append(
            f"{request.conflicting_changes} conflicting active change{'s' if request.conflicting_changes > 1 else ''} "
            f"- coordination risk detected"
        )
    
    # Factor 3: High reuse (where-used count)
    if request.where_used_count > 10:
        score += 2.0
        factors.append(f"High reuse factor: {request.where_used_count} parent assemblies")
    elif request.where_used_count > 5:
        score += 1.0
        factors.append(f"Moderate reuse: {request.where_used_count} parent assemblies")
    
    # Factor 4: BOM complexity
    if request.bom_depth > 4:
        score += 1.5
        factors.append(f"Complex BOM structure: {request.bom_depth} levels deep")
    elif request.bom_depth > 2:
        score += 0.5
        factors.append(f"Moderate BOM depth: {request.bom_depth} levels")
    
    # Factor 5: Change type severity
    high_risk_changes = ["OBSOLETE", "DELETE"]
    if request.change_type.upper() in high_risk_changes:
        score += 1.0
        factors.append(f"{request.change_type} is a high-impact change type")
    
    # Factor 6: Current lifecycle state
    if request.lifecycle_state.upper() == "RELEASED":
        score += 1.5
        factors.append("Part is RELEASED - formal change process required")
    elif request.lifecycle_state.upper() == "UNDERREVIEW":
        score += 0.5
        factors.append("Part is UNDER REVIEW - may cause review delays")
    
    # Cap score at 10
    score = min(score, 10.0)
    
    # If no factors, it's low risk
    if not factors:
        factors.append("No major risk factors detected")
        factors.append("Part has minimal dependencies")
    
    risk_level = get_risk_level(score)
    recommendations = generate_recommendations(risk_level, factors, request.change_type)
    
    # Calculate latency
    end_time = datetime.now()
    latency_ms = (end_time - start_time).total_seconds() * 1000
    
    return RiskPredictionResponse(
        risk_score=round(score, 1),
        risk_level=risk_level,
        confidence=0.75,  # Rule-based has good confidence but not perfect
        factors=factors,
        recommendations=recommendations,
        model_version="RULE_BASED_V1",
        prediction_time_ms=round(latency_ms, 2)
    )

# ==================== ML Model Prediction ====================

def ml_model_prediction(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """ML-based risk prediction using trained model.
    
    TODO: Implement after model training in Phase 1C.
    """
    start_time = datetime.now()
    
    try:
        # Feature engineering (must match training pipeline)
        features = np.array([[
            request.bom_depth,
            request.where_used_count,
            request.released_affected,
            request.conflicting_changes,
            1 if request.lifecycle_state.upper() == "RELEASED" else 0,
            1 if request.change_type.upper() in ["OBSOLETE", "DELETE"] else 0
        ]])
        
        # Predict
        risk_score_raw = float(trained_model.predict(features)[0])
        risk_score = min(max(risk_score_raw, 0), 10)  # Clamp to 0-10
        
        # Get probability/confidence if available
        if hasattr(trained_model, 'predict_proba'):
            proba = trained_model.predict_proba(features)
            confidence = float(np.max(proba))
        else:
            confidence = 0.85  # Default for regression models
        
        risk_level = get_risk_level(risk_score)
        
        # Analyze feature importance for explanation
        factors = analyze_ml_factors(request, risk_score)
        recommendations = generate_recommendations(risk_level, factors, request.change_type)
        
        end_time = datetime.now()
        latency_ms = (end_time - start_time).total_seconds() * 1000
        
        return RiskPredictionResponse(
            risk_score=round(risk_score, 1),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            factors=factors,
            recommendations=recommendations,
            model_version="ML_RANDOM_FOREST_V1",
            prediction_time_ms=round(latency_ms, 2)
        )
    
    except Exception as e:
        logger.error(f"ML prediction failed: {e}, falling back to rule-based")
        return rule_based_risk_prediction(request)

def analyze_ml_factors(request: RiskPredictionRequest, risk_score: float) -> List[str]:
    """Analyze which factors contributed most to ML prediction.
    
    Uses feature importance from model to explain results.
    """
    factors = []
    
    # Simple heuristic-based explanation (in production, use SHAP or LIME)
    if request.released_affected > 0:
        factors.append(f"{request.released_affected} released parts affected (high impact)")
    
    if request.conflicting_changes > 0:
        factors.append(f"{request.conflicting_changes} conflicting changes detected")
    
    if request.where_used_count > 8:
        factors.append(f"High dependency: {request.where_used_count} parent assemblies")
    
    if request.bom_depth > 3:
        factors.append(f"Complex structure: {request.bom_depth}-level BOM")
    
    if not factors:
        factors.append("Multiple minor risk factors contribute to moderate risk")
    
    return factors

# ==================== API Endpoints ====================

@app.post("/predict-risk", response_model=RiskPredictionResponse, status_code=status.HTTP_200_OK)
async def predict_risk(request: RiskPredictionRequest):
    """Predict risk score for an engineering change request.
    
    Uses trained ML model if available, otherwise falls back to rule-based scoring.
    """
    logger.info(f"Risk prediction request for part_id={request.part_id}, change_type={request.change_type}")
    
    try:
        if trained_model is not None:
            response = ml_model_prediction(request)
        else:
            response = rule_based_risk_prediction(request)
        
        logger.info(
            f"Prediction complete: part_id={request.part_id}, "
            f"risk_score={response.risk_score}, level={response.risk_level}"
        )
        return response
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk prediction failed: {str(e)}"
        )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for container orchestration."""
    model_type = "ML" if trained_model is not None else "RULE_BASED"
    
    return HealthResponse(
        status="healthy",
        model_loaded=trained_model is not None,
        model_type=model_type,
        version="1.0.0",
        timestamp=datetime.now().isoformat()
    )

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "PLM AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "predict": "/predict-risk",
            "health": "/health",
            "docs": "/docs"
        }
    }

# ==================== Startup/Shutdown Events ====================

@app.on_event("startup")
async def startup_event():
    """Log startup information."""
    logger.info("PLM AI Service starting...")
    logger.info(f"Model loaded: {trained_model is not None}")
    logger.info("Service ready to accept requests")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("PLM AI Service shutting down...")
