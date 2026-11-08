"""
Session Persistence Router (Phase 5)
====================================
Endpoints for saving, loading, listing, and organizing mathematical exploration sessions.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

import storage

router = APIRouter(tags=["Session Persistence"])


class CreateSessionRequest(BaseModel):
    title: str = Field("Untitled Session", description="Human-readable session title")


class SaveExplorationRequest(BaseModel):
    domain: str = Field(..., description="Active domain identifier")
    input_type: str = Field(..., description="Input parsing type: 'edge_list' | 'formula' | 'json'")
    raw_data: str = Field(..., description="Input string submitted")
    result_data: Any = Field(..., description="Full mathematical result response dictionary")


@router.get(
    "/api/sessions",
    summary="List all persistent exploration sessions",
    status_code=status.HTTP_200_OK,
)
async def list_sessions() -> List[Dict[str, Any]]:
    """Returns all saved exploration sessions sorted by update time."""
    return storage.list_sessions()


@router.post(
    "/api/sessions",
    summary="Create a new exploration session",
    status_code=status.HTTP_201_CREATED,
)
async def create_session(payload: CreateSessionRequest) -> Dict[str, Any]:
    """Initializes a new session ledger."""
    return storage.create_session(payload.title)


@router.get(
    "/api/sessions/{session_id}",
    summary="Get session details and all saved mathematical explorations",
    status_code=status.HTTP_200_OK,
)
async def get_session(session_id: str) -> Dict[str, Any]:
    """Retrieve full session history and results."""
    sess = storage.get_session(session_id)
    if not sess:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return sess


@router.post(
    "/api/sessions/{session_id}/explorations",
    summary="Save a mathematical exploration result to a session",
    status_code=status.HTTP_201_CREATED,
)
async def save_exploration_to_session(
    session_id: str,
    payload: SaveExplorationRequest,
) -> Dict[str, Any]:
    """Records an exploration into the session history."""
    return storage.save_exploration(
        session_id=session_id,
        domain=payload.domain,
        input_type=payload.input_type,
        raw_data=payload.raw_data,
        result_data=payload.result_data,
    )


@router.delete(
    "/api/sessions/{session_id}",
    summary="Delete a session and all associated explorations",
    status_code=status.HTTP_200_OK,
)
async def delete_session(session_id: str) -> Dict[str, Any]:
    """Deletes the specified session."""
    success = storage.delete_session(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return {"status": "deleted", "session_id": session_id}
