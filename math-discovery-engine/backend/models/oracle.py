"""Pydantic models for Conjecture Oracle."""

from __future__ import annotations
from pydantic import BaseModel, Field


class OracleRequest(BaseModel):
    """Payload for Conjecture Oracle linear law discovery."""
    batch_data: list[dict] = Field(..., description="List of graph invariants dictionaries")


class OracleResponse(BaseModel):
    """Response containing discovered mathematical conjectures."""
    conjectures: list[str] = Field(..., description="List of discovered linear relationships")
