"""Tests for Weisfeiler-Lehman Graph Isomorphism and TDA."""


def test_process_wl_isomorphic_cycles(client):
    payload = {
        "formula1": "C_4",
        "formula2": "C_4",
    }
    response = client.post("/api/process-wl", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_isomorphic"] is True
    assert len(data["wl_steps1"]) > 0


def test_process_wl_non_isomorphic(client):
    payload = {
        "formula1": "C_4",
        "formula2": "K_4",
    }
    response = client.post("/api/process-wl", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_isomorphic"] is False


def test_process_tda_circle(client):
    payload = {
        "shape": "noisy_circle",
        "num_points": 50,
        "noise_level": 0.05,
    }
    response = client.post("/api/process-tda", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 50
    assert "barcodes" in data
    assert "H0" in data["barcodes"]
    assert "H1" in data["barcodes"]
