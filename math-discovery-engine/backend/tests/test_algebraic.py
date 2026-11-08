"""Tests for Algebraic Geometry & Exact Symbolic Computation endpoint."""


def test_process_algebraic_cone(client):
    payload = {
        "formula": "x**2 + y**2 - z**2",
        "resolution": 15,
        "bounds": 2.0,
    }
    response = client.post("/api/process-algebraic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert len(data["faces"]) > 0
    assert "jacobian" in data
    assert len(data["jacobian"]) == 3
    assert "exact_singularities" in data
    # Cone apex at origin (0, 0, 0)
    assert len(data["exact_singularities"]) > 0
