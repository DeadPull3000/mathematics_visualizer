"""Tests for Knot Theory endpoint."""


def test_process_knot_trefoil(client):
    payload = {"formula": "T_3_2"}
    response = client.post("/api/process-knot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0
    assert "invariants" in data
    assert data["invariants"]["p"] == 3
    assert data["invariants"]["q"] == 2
    assert "alexander_polynomial" in data
    assert data["genus"] == 1
    assert data["bridge_index"] == 2


def test_process_knot_invalid_formula(client):
    payload = {"formula": "INVALID_KNOT"}
    response = client.post("/api/process-knot", json=payload)
    assert response.status_code == 400
