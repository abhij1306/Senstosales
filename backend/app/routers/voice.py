"""
Voice Agent Router - Interface Layer
Delegates complex logic to VoiceService
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
import sqlite3
from app.db import get_db

from app.services.llm_client import get_llm_client
from app.services.voice_service import voice_service

import httpx # For specific STT error handling if needed, or move STT to service too? 
# STT is simple enough to stay or move. Let's keep STT here for now or move it? 
# The service has no STT method yet. I will keep STT here for Phase 2 scope or move it if needed. 
# actually, LLM Client handles STT. The router just calls it. That is fine.

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    """Chat request with UI context"""
    message: str
    session_id: Optional[str] = None
    ui_context: Optional[Dict[str, Any]] = None


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech to text using Groq Whisper"""
    try:
        audio_bytes = await audio.read()
        llm_client = get_llm_client()
        result = await llm_client.speech_to_text(
            audio_file=audio_bytes,
            filename=audio.filename or "audio.webm"
        )
        return result
    except Exception as e:
        logger.error(f"STT failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Speech-to-text failed: {str(e)}")


@router.post("/chat")
async def voice_chat(request: ChatRequest):
    """Process voice command (Unary)"""
    try:
        response = await voice_service.process_command(
            message=request.message,
            session_id=request.session_id,
            ui_context=request.ui_context,
            stream=False
        )
        return response
    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def voice_chat_stream(request: ChatRequest):
    """Process voice command (Streaming SSE)"""
    return StreamingResponse(
        voice_service.process_command(
            message=request.message,
            session_id=request.session_id,
            ui_context=request.ui_context,
            stream=True
        ),
        media_type="text/event-stream"
    )


@router.post("/confirm/{action}")
async def confirm_action(action: str, data: Dict[str, Any] = Body(...), db: sqlite3.Connection = Depends(get_db)):
    """Execute confirmed action"""
    # voice_service.execute_confirmed_action now returns a ServiceResult (or raises AppException)
    result = await voice_service.execute_confirmed_action(action, data, db)
    
    if not result.success:
        # Failure in business logic that wasn't an exception (e.g. valid input but operation failed)
        raise HTTPException(status_code=400, detail=result.message)
        
    return result.data


# Context endpoints can remain direct calls to context_manager or move to service
# Moving to service for consistency is better, but context_manager is already a service.
from app.services.context_manager import context_manager

@router.get("/context/{session_id}")
async def get_context(session_id: str):
    return await context_manager.get_context_summary(session_id)

@router.delete("/context/{session_id}")
async def clear_context(session_id: str):
    await context_manager.clear_context(session_id)
    return {"message": "Context cleared"}
