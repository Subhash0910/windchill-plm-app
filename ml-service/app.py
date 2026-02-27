from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
import joblib
import numpy as np
from typing import List, Optional, Dict
import os
import logging
from datetime import datetime
import pandas as pd

# Import chat service
from chat_service import PLMChatAssistant

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PLM AI Service",
    description="Machine Learning service for Windchill PLM Impact Analysis",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chat assistant
chat_assistant = PLMChatAssistant()

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

class ChatRequest(BaseModel):
    """Chat request model"""
    message: str = Field(..., description="User message")
    context: Optional[Dict] = Field(default=None, description="Optional context (part_number, change_type, etc.)")
    session_id: Optional[str] = Field(default=None, description="Session ID for conversation continuity")

class ChatResponse(BaseModel):
    """Chat response model"""
    text: str = Field(..., description="AI response text")
    actions: Optional[List[str]] = Field(default=None, description="Actions to perform (RUN_IMPACT_ANALYSIS, etc.)")
    action_params: Optional[Dict] = Field(default=None, description="Parameters for actions")
    suggestions: Optional[List[str]] = Field(default=None, description="Suggested follow-up queries")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_type: str
    chat_enabled: bool
    timestamp: str

# Chat endpoint
@app.post("/chat", response_model=ChatResponse, tags=["AI Assistant"])
async def chat(request: ChatRequest):
    """
    AI-powered chat assistant for PLM operations.
    
    Understands natural language queries about:
    - Risk analysis
    - Change process guidance
    - Part searches
    - Workflow recommendations
    
    Example queries:
    - "What's the risk of obsoleting part 001dfy?"
    - "How do I create an ECN?"
    - "Should I use ECN or ECR?"
    """
    try:
        logger.info(f"💬 Chat request: {request.message[:50]}...")
        
        # Get response from chat assistant - FIXED: use context instead of part_context
        response = chat_assistant.chat(
            user_message=request.message,
            context=request.context
        )
        
        return ChatResponse(**response)
        
    except Exception as e:
        logger.error(f"❌ Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/chat/clear", tags=["AI Assistant"])
async def clear_chat():
    """
    Clear chat conversation history and context.
    """
    chat_assistant.clear_context()
    return {"message": "Chat context cleared", "timestamp": datetime.utcnow().isoformat()}

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
        
        # Lifecycle one-hot (4)
        lifecycle_inwork = 1 if request.lifecycle_state == "INWORK" else 0
        lifecycle_released = 1 if request.lifecycle_state == "RELEASED" else 0
        lifecycle_under_review = 1 if request.lifecycle_state in ["UNDER_REVIEW", "UNDERREVIEW"] else 0
        lifecycle_prototype = 1 if request.lifecycle_state == "PROTOTYPE" else 0
        
        # Assemble feature vector
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
        
        # Predict
        risk_score = float(risk_model.predict(features)[0])
        confidence = 0.89
        
        # Determine risk level
        if risk_score < 4:
            risk_level = "LOW"
        elif risk_score < 7:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
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
        return rule_based_risk(request)

def rule_based_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """
    Fallback: Rule-based risk scoring when no ML model available.
    """
    score = 0.0
    factors = []
    
    if request.released_affected > 0:
        impact = min(request.released_affected * 3.0, 6.0)
        score += impact
        factors.append(f"{request.released_affected} released part(s) affected - critical impact")
    
    if request.conflicting_changes > 0:
        impact = min(request.conflicting_changes * 2.0, 4.0)
        score += impact
        factors.append(f"{request.conflicting_changes} conflicting active change(s) detected")
    
    if request.where_used_count > 5:
        score += 1.5
        factors.append(f"High reuse: used in {request.where_used_count} parent assemblies")
    elif request.where_used_count > 0:
        factors.append(f"Moderate reuse: used in {request.where_used_count} assemblies")
    
    if request.bom_depth > 3:
        score += 1.0
        factors.append(f"Complex BOM structure: {request.bom_depth} levels deep")
    
    if request.lifecycle_state == "RELEASED":
        score += 1.5
        factors.append("Part is RELEASED - requires formal change process")
    
    if request.change_type == "OBSOLETE":
        score += 1.0
        factors.append("Obsolescence requires supply chain validation")
    elif request.change_type == "REVISE":
        factors.append("Revision change - review all references")
    
    if request.has_compliance_issues:
        score += 2.0
        factors.append("Compliance violations detected - regulatory review required")
    
    score = min(score, 10.0)
    
    if score < 4:
        risk_level = "LOW"
    elif score < 7:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
    
    if not factors:
        factors.append("No major risk factors detected - proceed with standard review")
    
    return RiskPredictionResponse(
        risk_score=round(score, 1),
        confidence=0.75,
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
        chat_enabled=True,
        timestamp=datetime.utcnow().isoformat()
    )

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    return {
        "service": "PLM AI Service",
        "version": "2.0.0",
        "status": "running",
        "model_loaded": risk_model is not None,
        "chat_enabled": True,
        "endpoints": {
            "chat": "/chat",
            "predict": "/predict-risk",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)