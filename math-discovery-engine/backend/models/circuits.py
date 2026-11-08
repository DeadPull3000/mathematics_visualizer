"""Pydantic models for Boolean Circuit Complexity."""

from __future__ import annotations
from pydantic import BaseModel, Field


class CircuitRequest(BaseModel):
    """Payload for Complexity Theory boolean circuit computations."""
    formula: str = Field(..., description="Boolean logic formula string")


class CircuitResponse(BaseModel):
    """Response containing a DAG boolean circuit representation and complexity metrics."""
    nodes: list[dict] = Field(..., description="List of nodes with id and gate_type")
    edges: list[list[str]] = Field(..., description="List of [source, target] directed edges")
    invariants: dict = Field(..., description="Circuit invariants (depth, num_gates, num_vars)")
    saliency_scores: dict[str, float] = Field(..., description="Saliency mapping (1.0 on critical path, 0.2 otherwise)")
