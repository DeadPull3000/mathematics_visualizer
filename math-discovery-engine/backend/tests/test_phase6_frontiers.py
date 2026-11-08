"""
Unit and Integration Tests for Phase 6: Mathematical Frontiers
==============================================================
Tests:
- Ihara Zeta Function & Graph Riemann Hypothesis verification
- Ollivier-Ricci curvature via Optimal Transport LP
- Tropical Geometry, Newton Polygon, Pick's theorem genus
- REST API endpoints /api/frontiers/*
"""

import pytest
import networkx as nx
from fastapi.testclient import TestClient

from app import create_app
from services.ihara import compute_ihara_zeta
from services.ricci import compute_ollivier_ricci
from services.tropical import analyze_tropical_curve


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


def test_ihara_zeta_petersen_graph():
    """Verify Bass polynomial and Ramanujan expander status for the Petersen graph."""
    G = nx.petersen_graph()
    res = compute_ihara_zeta(G)

    assert res["num_vertices"] == 10
    assert res["num_edges"] == 15
    assert res["cyclomatic_rank"] == 6  # Betti 1
    assert res["is_regular"] is True
    assert res["degree"] == 3.0
    assert res["is_ramanujan"] is True
    assert abs(res["ramanujan_bound"] - 2.8284) < 1e-3
    assert abs(res["critical_radius"] - 0.7071) < 1e-3
    assert res["lambda_2"] <= res["ramanujan_bound"]
    assert res["poles_count"] > 0
    assert "mathbf{Z}" in res["latex_formula"]


def test_ollivier_ricci_barbell_graph():
    """Verify Ollivier-Ricci curvature correctly flags bridge as negative bottleneck."""
    G = nx.Graph()
    # Triangle 1
    G.add_edges_from([(0, 1), (1, 2), (2, 0)])
    # Triangle 2
    G.add_edges_from([(3, 4), (4, 5), (5, 3)])
    # Bridge
    G.add_edge(2, 3)

    res = compute_ollivier_ricci(G)
    assert len(res["edges"]) == 7
    assert len(res["bottlenecks"]) >= 1
    # Check that bridge (2, 3) has negative curvature
    bridge_edge = next(e for e in res["edges"] if (e["u"] == 2 and e["v"] == 3) or (e["u"] == 3 and e["v"] == 2))
    assert bridge_edge["curvature"] < 0.0
    assert bridge_edge["type"] == "bottleneck"

    # Check that triangle edge has positive curvature
    tri_edge = next(e for e in res["edges"] if (e["u"] == 0 and e["v"] == 1) or (e["u"] == 1 and e["v"] == 0))
    assert tri_edge["curvature"] > 0.0
    assert tri_edge["type"] == "cluster"


def test_tropical_geometry_elliptic_curve():
    """Verify Newton polygon and genus 1 for Weierstrass elliptic curve."""
    formula = "y**2 - x**3 - x - 1"
    res = analyze_tropical_curve(formula)

    assert res["area"] == 3.0
    assert res["boundary_points_count"] == 6
    assert res["tropical_genus"] == 1  # Elliptic curve genus = 1!
    assert [1, 1] in res["interior_lattice_points"]
    assert "g_{\\text{trop}} = 1" in res["latex_summary"]


def test_tropical_geometry_quartic_curve():
    """Verify degree 4 Fermat curve has genus 3."""
    formula = "x**4 + y**4 - 1"
    res = analyze_tropical_curve(formula)

    assert res["area"] == 8.0
    assert res["boundary_points_count"] == 12
    assert res["tropical_genus"] == 3  # (4-1)(4-2)/2 = 3


def test_frontiers_api_endpoints(client):
    """Test REST API routes for all three frontiers."""
    # 1. Ihara
    res = client.post("/api/frontiers/ihara", json={
        "raw_data": "0 1\n1 2\n2 3\n3 0\n0 2",
        "input_type": "edge_list"
    })
    assert res.status_code == 200
    data = res.json()
    assert "bass_polynomial_coeffs" in data
    assert "poles" in data

    # 2. Ricci
    res = client.post("/api/frontiers/ricci", json={
        "raw_data": "0 1\n1 2\n2 0\n2 3\n3 4\n4 5\n5 3",
        "input_type": "edge_list"
    })
    assert res.status_code == 200
    data = res.json()
    assert "average_curvature" in data
    assert len(data["edges"]) == 7

    # 3. Tropical
    res = client.post("/api/frontiers/tropical", json={
        "formula": "y**2 - x**3 - 1"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["tropical_genus"] == 1
    assert "interior_lattice_points" in data
