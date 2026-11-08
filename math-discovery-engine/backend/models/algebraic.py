"""Pydantic models for Algebraic Geometry and Symbolic Computation."""

from __future__ import annotations
from pydantic import BaseModel, Field


class AlgebraicRequest(BaseModel):
    """Payload for Algebraic Geometry computations."""
    formula: str = Field(..., description="Implicit polynomial equation F(x, y, z) = 0")
    resolution: int = Field(30, description="Grid resolution for marching cubes")
    bounds: float = Field(3.0, description="Spatial bounds for x, y, z [-bounds, bounds]")


class AlgebraicResponse(BaseModel):
    """Response containing extracted isosurface of an algebraic variety."""
    nodes: list[dict] = Field(..., description="List of nodes with id, fx, fy, fz")
    faces: list[list[int]] = Field(..., description="List of [node_i, node_j, node_k] triangular faces")
    edges: list[list[int]] = Field(..., description="List of [source, target] edge pairs")
    invariants: dict = Field(..., description="Invariants (num_vertices, num_faces)")
    saliency_scores: dict[int, float] = Field(..., description="Singularity Score mapping node ID to [0.0, 1.0]")
    jacobian: list[str] = Field(default_factory=list, description="Symbolic Jacobian [Fx, Fy, Fz]")
    exact_singularities: list[dict] = Field(default_factory=list, description="Exact symbolic singular points")
