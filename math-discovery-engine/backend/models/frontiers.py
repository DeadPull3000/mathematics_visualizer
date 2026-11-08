"""Pydantic models for Mathematical Frontiers (Phase 6):
- Ihara Zeta Function & Ramanujan Graph Verification
- Discrete Ollivier-Ricci Curvature & Bottleneck Analysis
- Tropical Geometry & Newton Polygons
"""

from __future__ import annotations
from typing import Union, Optional
from pydantic import BaseModel, Field


class IharaPole(BaseModel):
    """Pole of the Ihara zeta function in the complex plane."""
    re: float = Field(..., description="Real part of pole")
    im: float = Field(..., description="Imaginary part of pole")
    abs: float = Field(..., description="Absolute modulus |u|")


class IharaRequest(BaseModel):
    """Payload to compute the Ihara Zeta function of a graph."""
    raw_data: str = Field(..., description="Graph representation (edge list or formula)")
    input_type: str = Field("edge_list", description="Input parser mode: edge_list | formula | json")


class IharaResponse(BaseModel):
    """Computed Ihara Zeta function, Bass determinant, and Ramanujan certificate."""
    num_vertices: int
    num_edges: int
    cyclomatic_rank: int
    bass_polynomial_coeffs: list[float]
    is_regular: bool
    degree: float
    is_ramanujan: bool
    ramanujan_bound: float
    critical_radius: float
    lambda_2: float
    girth: Optional[int] = None
    poles_count: int
    poles: list[IharaPole]
    latex_formula: str
    explanation: str


class RicciEdge(BaseModel):
    """Edge with computed Ollivier-Ricci curvature."""
    u: Union[int, str]
    v: Union[int, str]
    curvature: float
    type: str = Field(..., description="'cluster' (k > 0.1), 'flat' (-0.1 <= k <= 0.1), or 'bottleneck' (k < -0.1)")


class RicciRequest(BaseModel):
    """Payload to compute Ollivier-Ricci curvature on a graph."""
    raw_data: str = Field(..., description="Graph representation (edge list or formula)")
    input_type: str = Field("edge_list", description="Input parser mode")
    alpha: float = Field(0.0, description="Idleness parameter in [0, 1) for lazy random walk measure")


class RicciResponse(BaseModel):
    """Ollivier-Ricci curvature spectrum and network bottleneck geometry."""
    edges: list[RicciEdge]
    average_curvature: float
    min_curvature: float
    max_curvature: float
    bottlenecks: list[list[Union[int, str]]]
    clusters: list[list[Union[int, str]]]
    diameter: int
    explanation: str


class TropicalRequest(BaseModel):
    """Payload to analyze a polynomial under tropical geometry."""
    formula: str = Field(..., description="Polynomial in x and y, e.g., 'y**2 - x**3 - x - 1'")


class TropicalResponse(BaseModel):
    """Newton polygon, Pick's theorem genus, and tropical corner locus."""
    formula: str
    monomials: list[dict]
    newton_polygon_vertices: list[list[int]]
    area: float
    boundary_points_count: int
    interior_lattice_points: list[list[int]]
    tropical_genus: int
    corner_vertices: list[dict]
    latex_summary: str
    explanation: str
