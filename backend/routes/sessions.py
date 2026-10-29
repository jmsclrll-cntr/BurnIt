from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import SessionCreate, SessionResponse, SessionFinish
from session_manager import session_manager
from auth import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("", response_model=SessionResponse)
async def create_workout_session(body: SessionCreate, user: Optional[dict] = Depends(get_current_user)):
    user_id = user["username"] if user else body.user_id or "guest"
    session_id = await session_manager.create_session(user_id=user_id, exercise=body.exercise)
    session_data = await session_manager.get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=500, detail="Failed to initialize workout session")
    return SessionResponse(**session_data)

@router.post("/{session_id}/finish", response_model=SessionResponse)
async def finish_workout_session(session_id: str, body: Optional[SessionFinish] = None):
    data = body.dict() if body else None
    summary = await session_manager.finish_session(session_id, finish_data=data)
    return SessionResponse(**summary)

@router.get("/{session_id}", response_model=SessionResponse)
async def get_workout_session(session_id: str):
    data = await session_manager.get_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(**data)

@router.get("/users/{user_id}/history")
async def get_user_workout_history(user_id: str):
    return await session_manager.get_user_history(user_id)

