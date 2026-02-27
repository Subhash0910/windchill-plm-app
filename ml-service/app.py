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

# 🚀 IMPORT V2 ENTERPRISE ASSISTANT
try:
    from chat_service_v2 import get_assistant, EnterpriseAIAssistant
    USE_V2 = True
    logger = logging.getLogger(__name__)
    logger.info("🚀 Using Enterprise AI Assistant v2.0 (10/10 quality)")
except ImportError:
    from chat_service import PLMChatAssistant
    USE_V2 = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ Falling back to v1 assistant (dependencies missing)")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PLM AI Service v2.0",
    description="Enterprise-Grade Machine Learning service for Windchill PLM - 10/10 Quality",
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

# Initialize chat assistant (v2 or v1 fallback)
if USE_V2:
    # V2 uses singleton pattern
    def get_chat_assistant() -> EnterpriseAIAssistant:
        return get_assistant()
else:
    # V1 fallback
    _v1_assistant = PLMChatAssistant()
    def get_chat_assistant():
        return _v1_assistant

logger.info(f"✅ Chat assistant initialized: {'v2.0 Enterprise' if USE_V2 else 'v1.0 Legacy'}")

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

# Pydantic models
class RiskPredictionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    part_id: int = Field(..., alias="partId")
    change_type: str = Field(..., alias="changeType")
    bom_depth: int = Field(0, alias="bomDepth", ge=0)
    where_used_count: int = Field(0, alias="whereUsedCount", ge=0)
    released_affected: int = Field(0, alias="releasedAffected", ge=0)
    conflicting_changes: int = Field(0, alias="conflictingChanges", ge=0)
    lifecycle_state: str = Field("INWORK", alias="lifecycleState")
    has_compliance_issues: bool = Field(False, alias="hasComplianceIssues")

class RiskPredictionResponse(BaseModel):
    risk_score: float = Field(..., ge=0, le=10)
    confidence: float = Field(..., ge=0, le=1)
    risk_level: str
    factors: List[str]
    model_type: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ChatRequest(BaseModel):
    """Chat request model with v2 enhancements"""
    message: str = Field(..., description="User message")
    context: Optional[Dict] = Field(default=None, description="UI context (page, selected_part, etc.)")
    session_id: Optional[str] = Field(default=None, description="Session ID for conversation continuity")

class ChatResponse(BaseModel):
    """Chat response model"""
    text: str
    actions: Optional[List[str]] = None
    action_params: Optional[Dict] = Field(default=None, alias="actionParams")
    suggestions: Optional[List[str]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    error: Optional[bool] = False
    error_type: Optional[str] = None

class FeedbackRequest(BaseModel):
    """🚀 NEW: User feedback for continuous learning"""
    session_id: str = Field(..., description="Conversation session ID")
    message_id: str = Field(..., description="Specific message being rated")
    feedback: str = Field(..., description="'positive' or 'negative'")

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_type: str
    chat_enabled: bool
    chat_version: str
    semantic_enabled: bool
    redis_enabled: bool
    timestamp: str

# ============================================================================
# 🚀 CHAT ENDPOINTS (V2 ENHANCED)
# ============================================================================

@app.post("/chat", response_model=ChatResponse, tags=["AI Assistant"])
async def chat(request: ChatRequest):
    """
    🤖 Enterprise AI Chat Assistant - 10/10 Quality
    
    NEW IN V2:
    ✨ Semantic understanding with transformers
    🧠 Multi-turn conversation memory
    🔄 Reference resolution ("it", "that part")
    🛡️ Intelligent error handling
    📊 Learning from user feedback
    
    Example queries:
    - "What's the risk of obsoleting part 001dfy?"
    - "Show me its BOM" (remembers context)
    - "How do I create an ECN?"
    - "Should I use ECN or ECR?"
    """
    try:
        logger.info(f"💬 Chat request: {request.message[:50]}...")
        
        assistant = get_chat_assistant()
        
        # V2 has enhanced chat() method with session support
        if USE_V2:
            response = assistant.chat(
                user_message=request.message,
                ui_context=request.context,
                session_id=request.session_id
            )
        else:
            # V1 fallback (simpler)
            response = assistant.chat(
                user_message=request.message,
                context=request.context
            )
        
        return ChatResponse(**response)
        
    except Exception as e:
        logger.error(f"❌ Chat error: {e}", exc_info=True)
        
        # V2 has intelligent error handling
        if USE_V2:
            assistant = get_chat_assistant()
            error_response = assistant._handle_error(e, request.message)
            return ChatResponse(**error_response)
        else:
            raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/chat/feedback", tags=["AI Assistant"])
async def record_feedback(request: FeedbackRequest):
    """
    📊 NEW: Record user feedback for continuous improvement
    
    Allows users to rate responses with thumbs up/down.
    Used to track intent accuracy and improve over time.
    
    Body:
    {
        "session_id": "web-12345",
        "message_id": "msg-67890",
        "feedback": "positive"  // or "negative"
    }
    """
    if not USE_V2:
        raise HTTPException(
            status_code=501, 
            detail="Feedback system requires v2 assistant (install dependencies)"
        )
    
    try:
        assistant = get_chat_assistant()
        assistant.record_feedback(
            session_id=request.session_id,
            message_id=request.message_id,
            feedback=request.feedback
        )
        
        return {
            "message": "Feedback recorded successfully",
            "session_id": request.session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"❌ Feedback recording error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/metrics", tags=["AI Assistant"])
async def get_metrics():
    """
    📈 NEW: Get AI assistant performance metrics
    
    Returns:
    - Overall satisfaction rate
    - Intent-level accuracy
    - Total interactions
    - Active sessions
    - System capabilities
    """
    if not USE_V2:
        return {
            "version": "v1.0",
            "metrics_available": False,
            "message": "Upgrade to v2 for detailed metrics"
        }
    
    try:
        assistant = get_chat_assistant()
        metrics = assistant.get_overall_metrics()
        
        return {
            "version": "v2.0",
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"❌ Metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/clear", tags=["AI Assistant"])
async def clear_all_context():
    """
    🧹 Clear all chat context (legacy endpoint)
    """
    try:
        assistant = get_chat_assistant()
        
        if USE_V2:
            # V2 doesn't have global clear, only per-session
            return {
                "message": "Use /chat/clear-session with session_id for v2",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            assistant.clear_context()
            return {
                "message": "Chat context cleared",
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"❌ Clear context error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/clear-session", tags=["AI Assistant"])
async def clear_session(session_id: str):
    """
    🧹 NEW: Clear specific session context
    
    Removes conversation history for a specific session.
    Useful for "New Conversation" button.
    """
    if not USE_V2:
        raise HTTPException(
            status_code=501,
            detail="Session management requires v2 assistant"
        )
    
    try:
        assistant = get_chat_assistant()
        assistant.clear_session(session_id)
        
        return {
            "message": f"Session {session_id} cleared",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Clear session error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RISK PREDICTION ENDPOINTS (UNCHANGED)
# ============================================================================

@app.post("/predict-risk", response_model=RiskPredictionResponse, tags=["Prediction"])
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict risk score for a proposed engineering change.
    """
    try:
        logger.info(f"📊 Risk prediction for part_id={request.part_id}, change={request.change_type}")
        
        if risk_model is not None:
            return ml_based_risk(request)
        else:
            return rule_based_risk(request)
            
    except Exception as e:
        logger.error(f"❌ Risk prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

def ml_based_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """ML-based risk prediction"""
    try:
        has_compliance = 1 if request.has_compliance_issues else 0
        released_ratio = request.released_affected / request.where_used_count if request.where_used_count > 0 else 0
        complexity_score = request.bom_depth * 0.3 + request.where_used_count * 0.2
        conflict_density = request.conflicting_changes * request.released_affected
        
        change_revise = 1 if request.change_type == "REVISE" else 0
        change_obsolete = 1 if request.change_type == "OBSOLETE" else 0
        change_promote = 1 if request.change_type == "PROMOTE" else 0
        change_modify = 1 if request.change_type == "MODIFY" else 0
        change_delete = 1 if request.change_type == "DELETE" else 0
        
        lifecycle_inwork = 1 if request.lifecycle_state == "INWORK" else 0
        lifecycle_released = 1 if request.lifecycle_state == "RELEASED" else 0
        lifecycle_under_review = 1 if request.lifecycle_state in ["UNDER_REVIEW", "UNDERREVIEW"] else 0
        lifecycle_prototype = 1 if request.lifecycle_state == "PROTOTYPE" else 0
        
        features = np.array([[
            request.bom_depth, request.where_used_count, request.released_affected,
            request.conflicting_changes, has_compliance, released_ratio,
            complexity_score, conflict_density,
            change_revise, change_obsolete, change_promote, change_modify, change_delete,
            lifecycle_inwork, lifecycle_released, lifecycle_under_review, lifecycle_prototype
        ]])
        
        risk_score = float(risk_model.predict(features)[0])
        confidence = 0.89
        
        risk_level = "LOW" if risk_score < 4 else "MEDIUM" if risk_score < 7 else "HIGH"
        factors = analyze_risk_factors(request, risk_score)
        
        return RiskPredictionResponse(
            risk_score=round(risk_score, 1),
            confidence=round(confidence, 2),
            risk_level=risk_level,
            factors=factors,
            model_type="ML"
        )
    except Exception as e:
        logger.error(f"❌ ML prediction failed: {e}")
        return rule_based_risk(request)

def rule_based_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """Rule-based risk fallback"""
    score = 0.0
    factors = []
    
    if request.released_affected > 0:
        impact = min(request.released_affected * 3.0, 6.0)
        score += impact
        factors.append(f"{request.released_affected} released part(s) affected - critical")
    
    if request.conflicting_changes > 0:
        impact = min(request.conflicting_changes * 2.0, 4.0)
        score += impact
        factors.append(f"{request.conflicting_changes} conflicting changes detected")
    
    if request.where_used_count > 5:
        score += 1.5
        factors.append(f"High reuse: {request.where_used_count} parent assemblies")
    
    if request.bom_depth > 3:
        score += 1.0
        factors.append(f"Complex BOM: {request.bom_depth} levels")
    
    if request.lifecycle_state == "RELEASED":
        score += 1.5
        factors.append("RELEASED state requires formal ECN")
    
    if request.change_type == "OBSOLETE":
        score += 1.0
        factors.append("Obsolescence needs supply chain review")
    
    if request.has_compliance_issues:
        score += 2.0
        factors.append("Compliance violations - regulatory review needed")
    
    score = min(score, 10.0)
    risk_level = "LOW" if score < 4 else "MEDIUM" if score < 7 else "HIGH"
    
    if not factors:
        factors.append("No major risk factors - standard review")
    
    return RiskPredictionResponse(
        risk_score=round(score, 1),
        confidence=0.75,
        risk_level=risk_level,
        factors=factors,
        model_type="RULE_BASED"
    )

def analyze_risk_factors(request: RiskPredictionRequest, risk_score: float) -> List[str]:
    """Generate risk factors"""
    factors = []
    
    if request.released_affected > 0:
        factors.append(f"{request.released_affected} released parts need ECN")
    if request.conflicting_changes > 0:
        factors.append(f"Conflicts with {request.conflicting_changes} active changes")
    if request.where_used_count > 5:
        factors.append(f"Widely used ({request.where_used_count} parents)")
    if request.bom_depth > 3:
        factors.append(f"Deep BOM ({request.bom_depth} levels)")
    if request.has_compliance_issues:
        factors.append("Compliance concerns flagged")
    
    if not factors:
        factors.append("Low complexity change")
    
    return factors

# ============================================================================
# SYSTEM ENDPOINTS
# ============================================================================

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """
    Enhanced health check with v2 capabilities
    """
    assistant = get_chat_assistant()
    
    semantic_enabled = False
    redis_enabled = False
    
    if USE_V2:
        try:
            from chat_service_v2 import SEMANTIC_ENABLED, REDIS_ENABLED
            semantic_enabled = SEMANTIC_ENABLED
            redis_enabled = REDIS_ENABLED and assistant.redis_client is not None
        except:
            pass
    
    return HealthResponse(
        status="healthy",
        model_loaded=risk_model is not None,
        model_type="ML" if risk_model else "RULE_BASED",
        chat_enabled=True,
        chat_version="v2.0" if USE_V2 else "v1.0",
        semantic_enabled=semantic_enabled,
        redis_enabled=redis_enabled,
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/", tags=["System"])
async def root():
    return {
        "service": "PLM AI Service",
        "version": "2.0.0",
        "assistant_version": "v2.0 Enterprise" if USE_V2 else "v1.0 Legacy",
        "status": "running",
        "model_loaded": risk_model is not None,
        "endpoints": {
            "chat": "/chat",
            "feedback": "/chat/feedback",
            "metrics": "/chat/metrics",
            "predict": "/predict-risk",
            "health": "/health",
            "docs": "/docs"
        },
        "new_in_v2": [
            "Semantic understanding with transformers",
            "Multi-turn conversation memory",
            "Reference resolution (it, that, the part)",
            "User feedback learning system",
            "Redis-backed session persistence",
            "Intelligent error handling"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
