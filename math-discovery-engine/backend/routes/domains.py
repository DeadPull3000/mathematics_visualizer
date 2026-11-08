"""
Domain Registry Router (Phase 5)
================================
Provides endpoints for querying available mathematical domains and capabilities.
"""

from __future__ import annotations
from typing import List
from fastapi import APIRouter, HTTPException, status
from domains.registry import DomainManifest, domain_registry

router = APIRouter(tags=["Domain Registry"])


@router.get(
    "/api/domains",
    response_model=List[DomainManifest],
    summary="List all registered mathematical domain plugins",
    status_code=status.HTTP_200_OK,
)
async def list_domains() -> List[DomainManifest]:
    """Returns all active domains available in the engine."""
    return domain_registry.list_all()


@router.get(
    "/api/domains/{domain_id}",
    response_model=DomainManifest,
    summary="Get specification for a particular domain",
    status_code=status.HTTP_200_OK,
)
async def get_domain(domain_id: str) -> DomainManifest:
    """Fetch domain details by ID."""
    domain = domain_registry.get(domain_id)
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain '{domain_id}' not found in registry.",
        )
    return domain
