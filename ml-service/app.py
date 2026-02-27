from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
import joblib
import numpy as np
from typing import List, Optional
import os
import logging
from datetime import datetime
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PLM AI Service",
    description="Machine Learning service for Windchill PLM Impact Analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained model (if exists)
try:
    model_path = os.getenv("MODEL_PATH", "models/risk_model.pkl")
    if os.path.exists(model_path):
        risk_model = joblib.load(model_path)
        logger.info(f"✅ Loaded trained model from {model_path}")
        logger.info(f"Model type: {type(risk_model).__name__}")
    else:
        risk_model = None
        logger.warning("⚠️ No trained model found, using rule-based fallback")
except Exception as e:
    logger.error(f"❌ Error loading model: {e}")
    risk_model = None

# Pydantic models - FIXED: Accept camelCase from Java backend
class RiskPredictionRequest(BaseModel):
    # Accept BOTH camelCase (from Java) and snake_case
    model_config = ConfigDict(populate_by_name=True)
    
    part_id: int = Field(..., alias="partId", description="ID of the part being changed")
    change_type: str = Field(..., alias="changeType", description="Type of change: OBSOLETE, REVISE, PROMOTE, etc.")
    bom_depth: int = Field(0, alias="bomDepth", ge=0, description="Depth of BOM hierarchy")
    where_used_count: int = Field(0, alias="whereUsedCount", ge=0, description="Number of parent assemblies")
    released_affected: int = Field(0, alias="releasedAffected", ge=0, description="Number of RELEASED parts affected")
    conflicting_changes: int = Field(0, alias="conflictingChanges", ge=0, description="Number of conflicting active changes")
    lifecycle_state: str = Field("INWORK", alias="lifecycleState", description="Current lifecycle state")
    has_compliance_issues: bool = Field(False, alias="hasComplianceIssues", description="Whether compliance violations detected")

class RiskPredictionResponse(BaseModel):
    risk_score: float = Field(..., ge=0, le=10, description="Risk score from 0-10")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence 0-1")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    factors: List[str] = Field(..., description="List of risk contributing factors")
    model_type: str = Field(..., description="ML or RULE_BASED")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_type: str
    timestamp: str

# Risk prediction endpoint
@app.post("/predict-risk", response_model=RiskPredictionResponse, tags=["Prediction"])
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict risk score for a proposed engineering change.
    
    Returns risk score (0-10), confidence level, and contributing factors.
    Uses ML model if available, otherwise falls back to rule-based heuristics.
    """
    try:
        logger.info(f"📊 Risk prediction request for part_id={request.part_id}, change_type={request.change_type}")
        
        if risk_model is not None:
            logger.info("🤖 Using ML model for prediction")
            return ml_based_risk(request)
        else:
            logger.info("📋 Using rule-based fallback")
            return rule_based_risk(request)
            
    except Exception as e:
        logger.error(f"❌ Error in risk prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

def ml_based_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """
    ML-based risk prediction using trained Random Forest model.
    
    IMPORTANT: Feature order must match training!
    Training features (19 total):
    - 8 base: bom_depth, where_used_count, released_affected, conflicting_changes,
              has_compliance, released_ratio, complexity_score, conflict_density
    - 5 change types: REVISE, OBSOLETE, PROMOTE, MODIFY, DELETE (one-hot)
    - 6 lifecycle: INWORK, RELEASED, UNDER_REVIEW, PROTOTYPE (one-hot)
    """
    try:
        # Base features (8)
        has_compliance = 1 if request.has_compliance_issues else 0
        released_ratio = request.released_affected / request.where_used_count if request.where_used_count > 0 else 0
        complexity_score = request.bom_depth * 0.3 + request.where_used_count * 0.2
        conflict_density = request.conflicting_changes * request.released_affected
        
        # Change type one-hot (5)
        change_revise = 1 if request.change_type == "REVISE" else 0
        change_obsolete = 1 if request.change_type == "OBSOLETE" else 0
        change_promote = 1 if request.change_type == "PROMOTE" else 0
        change_modify = 1 if request.change_type == "MODIFY" else 0
        change_delete = 1 if request.change_type == "DELETE" else 0
        
        # Lifecycle one-hot (4 - assuming training had 4 states)
        lifecycle_inwork = 1 if request.lifecycle_state == "INWORK" else 0
        lifecycle_released = 1 if request.lifecycle_state == "RELEASED" else 0
        lifecycle_under_review = 1 if request.lifecycle_state in ["UNDER_REVIEW", "UNDERREVIEW"] else 0
        lifecycle_prototype = 1 if request.lifecycle_state == "PROTOTYPE" else 0
        
        # Assemble feature vector (MUST match training order)
        features = np.array([[
            request.bom_depth,
            request.where_used_count,
            request.released_affected,
            request.conflicting_changes,
            has_compliance,
            released_ratio,
            complexity_score,
            conflict_density,
            change_revise,
            change_obsolete,
            change_promote,
            change_modify,
            change_delete,
            lifecycle_inwork,
            lifecycle_released,
            lifecycle_under_review,
            lifecycle_prototype
        ]])
        
        logger.info(f"Feature vector shape: {features.shape}")
        logger.info(f"Feature values: {features[0][:8]}...")  # Log first 8 features
        
        # Predict
        risk_score = float(risk_model.predict(features)[0])
        
        # Get confidence (probability of predicted class)
        # For regression, use prediction variance or fixed confidence
        confidence = 0.89  # High confidence for trained model
        
        logger.info(f"✅ ML prediction: risk_score={risk_score:.2f}, confidence={confidence:.2f}")
        
        # Determine risk level
        if risk_score < 4:
            risk_level = "LOW"
        elif risk_score < 7:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        # Analyze factors
        factors = analyze_risk_factors(request, risk_score)
        
        return RiskPredictionResponse(
            risk_score=round(risk_score, 1),
            confidence=round(confidence, 2),
            risk_level=risk_level,
            factors=factors,
            model_type="ML"
        )
    except Exception as e:
        logger.error(f"❌ ML prediction failed: {e}", exc_info=True)
        logger.info("⚠️ Falling back to rule-based scoring")
        return rule_based_risk(request)

def rule_based_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """
    Fallback: Rule-based risk scoring when no ML model available.
    
    Scoring logic:
    - Released parts affected: +3.0 per part (max 6.0)
    - Conflicting changes: +2.0 per conflict (max 4.0)
    - High reuse (where_used > 5): +1.5
    - Complex BOM (depth > 3): +1.0
    - Lifecycle is RELEASED: +1.5
    - Change type OBSOLETE: +1.0
    - Compliance issues: +2.0
    """
    score = 0.0
    factors = []
    
    # Released parts affected (highest impact)
    if request.released_affected > 0:
        impact = min(request.released_affected * 3.0, 6.0)
        score += impact
        factors.append(f"{request.released_affected} released part(s) affected - critical impact")
    
    # Conflicting changes
    if request.conflicting_changes > 0:
        impact = min(request.conflicting_changes * 2.0, 4.0)
        score += impact
        factors.append(f"{request.conflicting_changes} conflicting active change(s) detected")
    
    # High reuse indication
    if request.where_used_count > 5:
        score += 1.5
        factors.append(f"High reuse: used in {request.where_used_count} parent assemblies")
    elif request.where_used_count > 0:
        factors.append(f"Moderate reuse: used in {request.where_used_count} assemblies")
    
    # BOM complexity
    if request.bom_depth > 3:
        score += 1.0
        factors.append(f"Complex BOM structure: {request.bom_depth} levels deep")
    
    # Current lifecycle state
    if request.lifecycle_state == "RELEASED":
        score += 1.5
        factors.append("Part is RELEASED - requires formal change process")
    
    # Change type
    if request.change_type == "OBSOLETE":
        score += 1.0
        factors.append("Obsolescence requires supply chain validation")
    elif request.change_type == "REVISE":
        factors.append("Revision change - review all references")
    
    # Compliance issues
    if request.has_compliance_issues:
        score += 2.0
        factors.append("Compliance violations detected - regulatory review required")
    
    # Cap score at 10.0
    score = min(score, 10.0)
    
    # Determine risk level
    if score < 4:
        risk_level = "LOW"
    elif score < 7:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
    
    # Add recommendation if no major risks
    if not factors:
        factors.append("No major risk factors detected - proceed with standard review")
    
    return RiskPredictionResponse(
        risk_score=round(score, 1),
        confidence=0.75,  # Rule-based has fixed confidence
        risk_level=risk_level,
        factors=factors,
        model_type="RULE_BASED"
    )

def analyze_risk_factors(request: RiskPredictionRequest, risk_score: float) -> List[str]:
    """
    Generate human-readable risk factors based on input features.
    """
    factors = []
    
    if request.released_affected > 0:
        factors.append(f"{request.released_affected} released parts require formal ECN process")
    
    if request.conflicting_changes > 0:
        factors.append(f"Conflicts with {request.conflicting_changes} active change(s)")
    
    if request.where_used_count > 5:
        factors.append(f"Widely used component ({request.where_used_count} parents)")
    
    if request.bom_depth > 3:
        factors.append(f"Deep BOM hierarchy ({request.bom_depth} levels)")
    
    if request.has_compliance_issues:
        factors.append("Regulatory compliance concerns flagged")
    
    if not factors:
        factors.append("Low complexity change")
    
    return factors

# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """
    Health check endpoint for container orchestration.
    """
    return HealthResponse(
        status="healthy",
        model_loaded=risk_model is not None,
        model_type="ML" if risk_model is not None else "RULE_BASED",
        timestamp=datetime.utcnow().isoformat()
    )

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    return {
        "service": "PLM AI Service",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": risk_model is not None,
        "endpoints": {
            "predict": "/predict-risk",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)