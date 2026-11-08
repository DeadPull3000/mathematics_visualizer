"""Tests for Batch Dataset Explorer and Conjecture Oracle."""


def test_process_batch_and_oracle(client):
    # 1. Generate batch data
    batch_payload = {"num_samples": 10}
    batch_response = client.post("/api/process-batch", json=batch_payload)
    assert batch_response.status_code == 200
    batch_data = batch_response.json()["data"]
    assert len(batch_data) == 10
    assert "vertices" in batch_data[0]
    assert "edges" in batch_data[0]
    assert "betti_0" in batch_data[0]

    # 2. Feed into Conjecture Oracle
    oracle_payload = {"batch_data": batch_data}
    oracle_response = client.post("/api/process-oracle", json=oracle_payload)
    assert oracle_response.status_code == 200
    conjectures = oracle_response.json()["conjectures"]
    assert isinstance(conjectures, list)
    assert len(conjectures) > 0
