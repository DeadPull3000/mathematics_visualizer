"""Pydantic models for Knot Theory."""

from __future__ import annotations
from typing import Union
from pydantic import BaseModel, Field


class KnotRequest(BaseModel):
    """Payload for Knot Theory computations."""
    formula: str = Field(..., description="Knot formula, e.g., T_3_2")


class KnotResponse(BaseModel):
    """Response containing 3D coordinates and topological invariants of a knot."""
    nodes: list[dict] = Field(..., description="List of nodes with id, fx, fy, fz")
    edges: list[list[int]] = Field(..., description="List of [source, target] edge pairs")
    invariants: dict = Field(..., description="Knot invariants (crossing_number, p, q, type, writhe)")
    saliency_scores: dict[Union[int, str], float] = Field(..., description="Local entanglement saliency scores mapping node ID to [0.0, 1.0].")
