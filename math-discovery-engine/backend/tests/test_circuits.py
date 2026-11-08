"""Tests for Boolean Circuit Complexity endpoint."""


def test_process_circuit_expression(client):
    payload = {"formula": "(A AND B) OR C"}
    response = client.post("/api/process-circuit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0
    assert "depth" in data["invariants"]
    assert "saliency_scores" in data
