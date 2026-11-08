"""
Mathematical Domain Registry (Phase 5: Plugin Architecture)
===========================================================
Defines the standard domain manifest interface and maintains a dynamic
registry of active mathematical domains supported by the engine.
"""

from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DomainManifest(BaseModel):
    """Manifest describing a mathematical domain plugin."""
    id: str = Field(..., description="Unique machine identifier (e.g. 'topology')")
    name: str = Field(..., description="Human-readable title (e.g. 'Spectral Graph Theory')")
    description: str = Field(..., description="Brief pedagogical description of the domain")
    category: str = Field("General", description="Mathematical category classification")
    color: str = Field("#D19E4A", description="Canonical hex accent color for this domain")
    icon: str = Field("⚗", description="Symbolic glyph representation")
    endpoint: str = Field(..., description="Primary computation API endpoint")
    is_active: bool = Field(True, description="Whether this domain is currently enabled")


class DomainRegistry:
    """Thread-safe registry of mathematical domains."""

    def __init__(self):
        self._domains: Dict[str, DomainManifest] = {}
        self._register_default_domains()

    def _register_default_domains(self):
        """Register the built-in canonical domains."""
        defaults = [
            DomainManifest(
                id="topology",
                name="Spectral Graph Theory & Simplicial Homology",
                description="Combinatorial & Normalized Laplacians, Cheeger conductance, Betti homology, and GNN saliency.",
                category="Topology & Networks",
                color="#C05640",
                icon="◎",
                endpoint="/api/process-object",
            ),
            DomainManifest(
                id="knot",
                name="Knot Theory & Alexander Invariants",
                description="Torus knot generation, crossing numbers, Seifert genus, and exact Alexander polynomials.",
                category="Topology & Knots",
                color="#D19E4A",
                icon="∞",
                endpoint="/api/process-knot",
            ),
            DomainManifest(
                id="manifold",
                name="Riemannian Manifolds & Curvature Tensors",
                description="Discrete Gauss-Bonnet angle deficits, Laplace-Beltrami mean curvature, and harmonic modes.",
                category="Differential Geometry",
                color="#6B8075",
                icon="∿",
                endpoint="/api/process-manifold",
            ),
            DomainManifest(
                id="algebraic-geometry",
                name="Algebraic Varieties & Singularity Theory",
                description="Zero loci V(F), Groebner basis Nullstellensatz certificates, and Hessian determinants.",
                category="Algebraic Geometry",
                color="#9B72CF",
                icon="∿",
                endpoint="/api/process-algebraic",
            ),
            DomainManifest(
                id="circuit",
                name="Boolean Circuit Complexity",
                description="Logical DAG parsing, circuit depth, gate area bounds, and critical path analysis.",
                category="Complexity Theory",
                color="#C05640",
                icon="⊕",
                endpoint="/api/process-circuit",
            ),
            DomainManifest(
                id="batch-explorer",
                name="Batch Ensemble Explorer & Conjecture Oracle",
                description="Ensemble sampling, SVD null-space theorem extraction, and Isolation Forest anomaly detection.",
                category="Machine Discovery",
                color="#D19E4A",
                icon="⋯",
                endpoint="/api/process-batch",
            ),
            DomainManifest(
                id="tda",
                name="Topological Data Analysis (TDA)",
                description="Vietoris-Rips filtration, persistent homology barcodes, and topological noise discrimination.",
                category="Topological Data Analysis",
                color="#5C80BC",
                icon="⧖",
                endpoint="/api/process-tda",
            ),
            DomainManifest(
                id="wl_test",
                name="Weisfeiler-Lehman Graph Isomorphism",
                description="Colour refinement iteration, structural fingerprinting, and non-isomorphic counterexample detection.",
                category="Graph Isomorphism",
                color="#888C8E",
                icon="⋍",
                endpoint="/api/process-wl",
            ),
        ]
        for d in defaults:
            self._domains[d.id] = d

    def register(self, manifest: DomainManifest) -> None:
        """Register or override a domain plugin."""
        self._domains[manifest.id] = manifest

    def get(self, domain_id: str) -> Optional[DomainManifest]:
        """Look up a domain by ID."""
        return self._domains.get(domain_id)

    def list_all(self) -> List[DomainManifest]:
        """Return all registered active domains."""
        return [d for d in self._domains.values() if d.is_active]


# Global domain registry singleton
domain_registry = DomainRegistry()
