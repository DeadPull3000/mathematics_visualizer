"""Pydantic models for Batch Graph Exploration."""

from __future__ import annotations
from pydantic import BaseModel, Field


class BatchRequest(BaseModel):
    """Payload for generating a batch of random graphs."""
    num_samples: int = Field(100, description="Number of random graphs to generate")


class BatchResponse(BaseModel):
    """Response containing batch graph dataset."""
    data: list[dict] = Field(..., description="List of dictionaries containing graph properties")
