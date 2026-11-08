"""Pydantic models for Manifolds and Differential Geometry."""

from __future__ import annotations
from typing import Union
from pydantic import BaseModel, Field


class ManifoldRequest(BaseModel):
    """Payload for Manifold computations."""
    shape: str = Field(..., description="Manifold shape, e.g., 'Sphere', 'Torus', or 'Custom'")
    resolution: int = Field(15, description="Resolution of the parametric grid")
    deformation: str = Field("none", description="Deformation type: 'none', 'stretch', or 'ripple'")
    parameter_t: float = Field(0.0, description="Continuous morphing parameter t")
    expr_x: str = Field("", description="Custom parametric equation for X(u, v)")
    expr_y: str = Field("", description="Custom parametric equation for Y(u, v)")
    expr_z: str = Field("", description="Custom parametric equation for Z(u, v)")
    u_min: float = Field(0.0, description="Minimum value for u")
    u_max: float = Field(6.28318, description="Maximum value for u")
    v_min: float = Field(0.0, description="Minimum value for v")
    v_max: float = Field(6.28318, description="Maximum value for v")
    deleted_nodes: list[int] = Field(default_factory=list, description="List of node IDs to excise from the manifold")


class ManifoldResponse(BaseModel):
    """Response containing 3D coordinates and invariants of a manifold mesh."""
    nodes: list[dict] = Field(..., description="List of nodes with id, fx, fy, fz")
    edges: list[list[Union[int, str]]] = Field(..., description="List of [source, target] edge pairs")
    faces: list[list[int]] = Field(..., description="List of [node_i, node_j, node_k] triangular faces")
    invariants: dict = Field(..., description="Manifold invariants (vertices, edges, euler_characteristic)")
    harmonics: dict[Union[int, str], float] = Field(..., description="2nd non-zero eigenvector of the Combinatorial Laplacian")
    gaussian_curvature: dict[Union[int, str], float] = Field(default_factory=dict, description="Discrete Gaussian curvature K_i per vertex")
    mean_curvature: dict[Union[int, str], float] = Field(default_factory=dict, description="Discrete Mean curvature H_i per vertex")
