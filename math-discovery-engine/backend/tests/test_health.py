"""Tests for health check endpoint."""


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "networkx" in data["libraries"]
    assert "numpy" in data["libraries"]
