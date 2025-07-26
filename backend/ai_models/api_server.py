#!/usr/bin/env python3
"""
FastAPI server for Genie AI Companion System
Provides REST API endpoints for the frontend to interact with your AI companion
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List
import json
import traceback
import base64
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Import your existing Genie AI system
from main import GenieAI
from config.settings import config

# Import emotion recognition service
from emotion_recognition_service import get_emotion_service, initialize_emotion_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global GenieAI instance
genie_ai: Optional[GenieAI] = None

# Global emotion service - will be initialized during startup
emotion_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup the Genie AI system"""
    global genie_ai, emotion_service
    try:
        logger.info("Initializing Genie AI system...")
        # Initialize with existing indexes to speed up startup
        genie_ai = GenieAI(skip_data_loading=True)
        logger.info("Genie AI system initialized successfully")
        
        # Initialize emotion recognition service
        logger.info("Initializing emotion recognition service...")
        emotion_available = initialize_emotion_service()
        if emotion_available:
            emotion_service = get_emotion_service()
            logger.info("Emotion recognition service initialized successfully")
        else:
            logger.warning("Emotion recognition service not available - continuing without emotion analysis")
            
        yield
    except Exception as e:
        logger.error(f"Failed to initialize systems: {e}")
        # Continue with limited functionality
        yield
    finally:
        logger.info("Shutting down systems...")
        if emotion_service:
            try:
                emotion_service.cleanup()
            except Exception as e:
                logger.error(f"Error cleaning up emotion service: {e}")

# Create FastAPI app
app = FastAPI(
    title="Genie AI API",
    description="AI Companion and Support System API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    session_id: str = Field(default="default", description="Session identifier")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    model: Optional[str] = Field(default=None, description="Preferred model")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response")
    confidence: float = Field(..., description="Response confidence score")
    sources: Optional[List[Dict]] = Field(default=None, description="Information sources")
    session_id: str = Field(..., description="Session identifier")
    processing_time: float = Field(..., description="Processing time in seconds")
    model_used: str = Field(..., description="Model used for response")
    error: Optional[str] = Field(default=None, description="Error message if any")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    system_info: Optional[Dict[str, Any]] = Field(default=None, description="System information")
    timestamp: str = Field(..., description="Response timestamp")

class SessionHistoryResponse(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    history: List[Dict] = Field(..., description="Conversation history")

class EmotionAnalysisRequest(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio data")
    audio_format: str = Field(default="webm", description="Audio format (webm, wav, etc.)")
    session_id: str = Field(default="default", description="Session identifier")
    top_emotions: int = Field(default=3, description="Number of top emotions to return")

class EmotionAnalysisResponse(BaseModel):
    emotions: List[Dict] = Field(..., description="List of detected emotions with confidence scores")
    primary_emotion: Optional[str] = Field(default=None, description="Primary detected emotion")
    confidence: float = Field(..., description="Confidence of primary emotion")
    mental_health_category: str = Field(..., description="Mental health category for detected emotion")
    session_id: str = Field(..., description="Session identifier")
    processing_time: float = Field(..., description="Processing time in seconds")
    error: Optional[str] = Field(default=None, description="Error message if any")

# API Routes

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with enhanced memory information"""
    try:
        system_info = None
        memory_info = {}
        
        if genie_ai:
            system_info = genie_ai.get_system_info()
            
            # Add memory system information
            if hasattr(genie_ai, 'orchestrator') and hasattr(genie_ai.orchestrator, 'memory'):
                memory = genie_ai.orchestrator.memory
                active_sessions = len(memory.conversations)
                total_summaries = sum(len(summaries) for summaries in memory.conversation_summaries.values())
                total_critical_context = sum(len(context) for context in memory.critical_context.values())
                
                memory_info = {
                    "active_sessions": active_sessions,
                    "total_summaries": total_summaries,
                    "total_critical_context_entries": total_critical_context,
                    "max_tokens_per_session": memory.max_tokens,
                    "conversation_window": memory.window_size,
                    "memory_system": "enhanced"
                }
                
                # Add memory info to system_info
                if system_info:
                    system_info["memory_system"] = memory_info
                else:
                    system_info = {"memory_system": memory_info}
        
        return HealthResponse(
            status="healthy" if genie_ai else "limited",
            system_info=system_info,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            status="error",
            timestamp=datetime.now().isoformat()
        )

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint"""
    start_time = datetime.now()
    
    try:
        # Validate request
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Check if Genie AI is available
        if not genie_ai:
            logger.error("Genie AI system not available")
            raise HTTPException(
                status_code=503, 
                detail="AI system not available. Please try again later."
            )
        
        logger.info(f"Processing chat request for session {request.session_id} with model: {request.model}")
        
        # Extract model preference from request context or model parameter
        model_preference = None
        if request.context and 'preferred_model' in request.context:
            model_preference = request.context['preferred_model']
        elif request.model:
            # Map frontend model IDs to backend preferences
            model_mapping = {
                "groq": "groq",
                "local": "local"
            }
            model_preference = model_mapping.get(request.model, request.model)
        
        logger.info(f"Using model preference: {model_preference}")
        
        # Check if emotion context is provided in the request
        emotion_context = None
        if request.context and 'emotion_analysis' in request.context:
            emotion_context = request.context['emotion_analysis']
            logger.info(f"Emotion context detected: {emotion_context.get('primary_emotion', 'unknown')} "
                       f"(confidence: {emotion_context.get('confidence', 0.0):.2f})")
        
        # Enhance context with emotion information for better responses
        enhanced_context = request.context.copy() if request.context else {}
        if emotion_context:
            enhanced_context['detected_emotion'] = emotion_context
            
            # Add mental health guidance based on detected emotion
            mental_health_category = emotion_context.get('mental_health_category', 'unknown')
            if mental_health_category in ['depression_risk', 'anxiety_risk', 'stress_response']:
                enhanced_context['requires_extra_care'] = True
                enhanced_context['emotion_guidance'] = f"User showing signs of {mental_health_category.replace('_', ' ')}"
        
        # Extract conversation history from context if present
        conversation_history = None
        if request.context and 'conversation_history' in request.context:
            conversation_history = request.context['conversation_history']

        # Process the query with model preference and enhanced context
        response_data = await genie_ai.chat(
            query=request.message,
            session_id=request.session_id,
            context=enhanced_context,
            model_preference=model_preference,  # Pass model preference
            conversation_history=conversation_history  # Pass conversation history
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Format response
        # Ensure sources is always a list of dicts
        sources = response_data.get("sources", [])
        if isinstance(sources, str):
            sources = [{"text": sources}]
        elif not isinstance(sources, list):
            sources = []
        elif any(not isinstance(s, dict) for s in sources):
            sources = [{"text": str(s)} if not isinstance(s, dict) else s for s in sources]
        return ChatResponse(
            response=response_data.get("response", "I apologize, but I couldn't generate a response."),
            confidence=response_data.get("confidence", 0.0),
            sources=sources,
            session_id=request.session_id,
            processing_time=processing_time,
            model_used=response_data.get("model", f"genie-rag-{model_preference or 'default'}"),
            error=response_data.get("error")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        
        return ChatResponse(
            response="I apologize, but I encountered an error processing your request. Please try again.",
            confidence=0.0,
            session_id=request.session_id,
            processing_time=processing_time,
            model_used="error",
            error=str(e)
        )

@app.get("/sessions/{session_id}/history", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str):
    """Get conversation history for a session"""
    try:
        if not genie_ai:
            raise HTTPException(status_code=503, detail="AI system not available")
        
        history = genie_ai.get_session_history(session_id)
        
        return SessionHistoryResponse(
            session_id=session_id,
            history=history
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session history")

@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session"""
    try:
        if not genie_ai:
            raise HTTPException(status_code=503, detail="AI system not available")
        
        genie_ai.clear_session(session_id)
        
        return {"message": f"Session {session_id} cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clear session error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear session")

@app.get("/system/info")
async def get_system_info():
    """Get detailed system information"""
    try:
        system_info = {}
        
        if genie_ai:
            system_info.update(genie_ai.get_system_info())
        else:
            system_info["genie_ai"] = "not available"
        
        # Add emotion service status
        if emotion_service:
            system_info["emotion_service"] = emotion_service.get_status()
        else:
            system_info["emotion_service"] = {"status": "not available"}
        
        return system_info
        
    except Exception as e:
        logger.error(f"System info error: {e}")
        return {"error": str(e)}

@app.post("/system/rebuild-indexes")
async def rebuild_indexes(background_tasks: BackgroundTasks):
    """Rebuild search indexes (background task)"""
    try:
        if not genie_ai:
            raise HTTPException(status_code=503, detail="AI system not available")
        
        # Run index rebuilding in background
        background_tasks.add_task(rebuild_indexes_task)
        
        return {"message": "Index rebuilding started in background"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rebuild indexes error: {e}")
        raise HTTPException(status_code=500, detail="Failed to start index rebuilding")

@app.post("/emotion/analyze", response_model=EmotionAnalysisResponse)
async def analyze_emotion(request: EmotionAnalysisRequest):
    """Analyze emotion from audio data"""
    start_time = datetime.now()
    
    try:
        # Validate request
        if not request.audio_data.strip():
            raise HTTPException(status_code=400, detail="Audio data cannot be empty")
        
        # Check if emotion service is available
        if not emotion_service or not emotion_service.is_available():
            logger.error("Emotion recognition service not available")
            raise HTTPException(
                status_code=503, 
                detail="Emotion recognition service not available"
            )
        
        logger.info(f"Processing emotion analysis request for session {request.session_id}")
        
        # Analyze emotion from base64 audio data
        if request.audio_format.lower() == "webm":
            # Decode base64 to bytes for WebM processing
            audio_bytes = base64.b64decode(request.audio_data)
            emotion_results = emotion_service.analyze_emotion_from_webm(
                audio_bytes, top_k=request.top_emotions
            )
        else:
            # Use base64 analysis for other formats
            emotion_results = emotion_service.analyze_emotion_from_base64(
                request.audio_data, top_k=request.top_emotions
            )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Check for errors in emotion analysis
        if emotion_results.get("error"):
            logger.error(f"Emotion analysis error: {emotion_results['error']}")
            return EmotionAnalysisResponse(
                emotions=[],
                primary_emotion=None,
                confidence=0.0,
                mental_health_category="unknown",
                session_id=request.session_id,
                processing_time=processing_time,
                error=emotion_results["error"]
            )
        
        # Format successful response
        return EmotionAnalysisResponse(
            emotions=emotion_results.get("emotions", []),
            primary_emotion=emotion_results.get("primary_emotion"),
            confidence=emotion_results.get("confidence", 0.0),
            mental_health_category=emotion_results.get("mental_health_category", "unknown"),
            session_id=request.session_id,
            processing_time=processing_time,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.error(f"Emotion analysis endpoint error: {e}", exc_info=True)
        
        return EmotionAnalysisResponse(
            emotions=[],
            primary_emotion=None,
            confidence=0.0,
            mental_health_category="unknown",
            session_id=request.session_id,
            processing_time=processing_time,
            error=str(e)
        )

async def rebuild_indexes_task():
    """Background task to rebuild indexes"""
    global genie_ai
    try:
        logger.info("Starting index rebuild...")
        genie_ai = GenieAI(skip_data_loading=False)
        logger.info("Index rebuild completed successfully")
    except Exception as e:
        logger.error(f"Index rebuild failed: {e}")

@app.get("/memory/{session_id}", response_model=Dict)
async def get_memory_stats(session_id: str):
    """Get memory statistics for a session"""
    try:
        if not genie_ai:
            raise HTTPException(
                status_code=503, 
                detail="AI system not available."
            )
        
        # Get memory stats from orchestrator
        stats = genie_ai.orchestrator.memory.get_memory_stats(session_id)
        
        return {
            "session_id": session_id,
            "memory_stats": stats,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting memory stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving memory statistics: {str(e)}"
        )

@app.get("/memory/{session_id}/history", response_model=Dict)
async def get_conversation_history(session_id: str):
    """Get conversation history for a session"""
    try:
        if not genie_ai:
            raise HTTPException(
                status_code=503, 
                detail="AI system not available."
            )
        
        # Get conversation history
        history = genie_ai.orchestrator.memory.get_history(session_id, include_summaries=True)
        
        return {
            "session_id": session_id,
            "history": history,
            "message_count": len(history),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversation history: {str(e)}"
        )

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred. Please try again.",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Genie AI API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    
    logger.info(f"Starting Genie AI API server on {args.host}:{args.port}")
    
    uvicorn.run(
        "api_server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    ) 