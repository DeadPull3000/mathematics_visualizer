"""Tests for Topology & Graph Theory endpoints."""


def test_process_object_formula_complete_graph(client):
    payload = {
        "input_type": "formula",
        "raw_data": "K_5",
    }
    response = client.post("/api/process-object", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 5
    assert len(data["edges"]) == 10
    assert data["metadata"]["num_nodes"] == 5
    assert data["metadata"]["num_edges"] == 10
    assert data["metadata"]["is_connected"] is True
    assert data["metadata"]["num_connected_components"] == 1
    # Check spectral topology fields
    assert "laplacian_eigenvalues" in data["topology"]
    assert "algebraic_connectivity" in data["topology"]
    assert "betti_numbers" in data["topology"]
    assert "saliency_scores" in data["topology"]
    assert "normalized_eigenvalues" in data["topology"]
    assert "spectral_gap" in data["topology"]
    assert "cheeger_bounds" in data["topology"]
    assert "heat_kernel_signatures" in data["topology"]
    assert "h1_generators" in data["topology"]
    assert "triangles" in data["topology"]
    # Complete graph K_5 has C(5, 3) = 10 triangles
    assert len(data["topology"]["triangles"]) == 10


def test_topology_h1_generators(client):
    # C_4 is a 4-cycle with b_1 = 1 hole and 0 triangles
    payload = {
        "input_type": "formula",
        "raw_data": "C_4",
    }
    response = client.post("/api/process-object", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["topology"]["betti_numbers"][1] == 1
    assert len(data["topology"]["h1_generators"]) == 1
    assert len(data["topology"]["triangles"]) == 0


def test_process_object_edge_list(client):
    payload = {
        "input_type": "edge_list",
        "raw_data": "0 1\n1 2\n2 0",
    }
    response = client.post("/api/process-object", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 3
    assert len(data["edges"]) == 3
    assert data["metadata"]["num_nodes"] == 3


def test_process_object_invalid_input(client):
    payload = {
        "input_type": "formula",
        "raw_data": "INVALID_NOTATION",
    }
    response = client.post("/api/process-object", json=payload)
    assert response.status_code == 400


def test_export_python(client):
    payload = {
        "input_type": "formula",
        "raw_data": "C_4",
    }
    response = client.post("/api/export-python", json=payload)
    assert response.status_code == 200
    assert "import networkx as nx" in response.text
    assert "G.add_nodes_from" in response.text
