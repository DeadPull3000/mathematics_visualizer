"""Pydantic models for Topological Data Analysis and Persistent Homology."""

from __future__ import annotations
from pydantic import BaseModel, Field


class TDARequest(BaseModel):
    """Payload for Topological Data Analysis (Persistent Homology) computations."""
    shape: str = Field("noisy_circle", description="Point cloud shape: 'noisy_circle', 'noisy_sphere', or 'random_noise'")
    num_points: int = Field(150, description="Number of sample points in the cloud")
    noise_level: float = Field(0.15, description="Standard deviation of Gaussian noise added to coordinates")


class TDAResponse(BaseModel):
    """Response containing 3D coordinates and persistence barcodes."""
    nodes: list[dict] = Field(..., description="List of nodes with id, fx, fy, fz")
    barcodes: dict[str, list[list[float]]] = Field(..., description="Persistence barcodes for H0 and H1 with [birth, death] pairs")
