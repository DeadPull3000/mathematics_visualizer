"""Tests for Manifold Differential Geometry endpoint."""


def test_process_manifold_sphere(client):
    payload = {
        "shape": "Sphere",
        "resolution": 10,
        "deformation": "none",
    }
    response = client.post("/api/process-manifold", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert len(data["faces"]) > 0
    assert "invariants" in data
    assert "euler_characteristic" in data["invariants"]
