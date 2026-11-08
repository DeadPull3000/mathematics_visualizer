"""Pydantic models for Mathematical Narrator."""

from __future__ import annotations
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class NarratorRequest(BaseModel):
    """Payload for generating mathematical narrative commentary."""
    domain: str = Field(..., description="Active mathematical domain (topology, algebraic, knot, manifold, circuit, tda)")
    invariants: Dict[str, Any] = Field(default_factory=dict, description="Invariants dictionary computed for the object")
    formula: str = Field("", description="Input formula or raw expression")


class NarratorResponse(BaseModel):
    """Structured narrative commentary explaining the mathematical structure."""
    summary: str = Field(..., description="High-level synopsis of the mathematical object")
    key_insights: List[str] = Field(..., description="Key mathematical insights and properties observed")
    theoretical_connections: List[str] = Field(..., description="Classical theorems and mathematical frameworks that apply")
    open_questions: List[str] = Field(..., description="Thought-provoking questions for mathematical discovery")
