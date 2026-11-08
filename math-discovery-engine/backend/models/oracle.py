"""Pydantic models for Conjecture Oracle."""

from __future__ import annotations
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class OracleRequest(BaseModel):
    """Payload for Conjecture Oracle linear law discovery."""
    batch_data: List[Dict[str, Any]] = Field(..., description="List of graph invariants dictionaries")


class OracleResponse(BaseModel):
    """Response containing discovered mathematical conjectures and anomalies."""
    conjectures: List[str] = Field(default_factory=list, description="All discovered mathematical relationships")
    linear_conjectures: List[str] = Field(default_factory=list, description="Discovered linear null-space laws")
    polynomial_conjectures: List[str] = Field(default_factory=list, description="Discovered non-linear polynomial cross-term laws")
    anomalies: List[Dict[str, Any]] = Field(default_factory=list, description="Outlier graphs detected via Isolation Forest")
