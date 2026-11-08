"""
Tests for Phase 3: Mathematical Intelligence & Automated Discovery
===================================================================
Tests graph family classification, non-linear polynomial oracle,
outlier anomaly detection, mathematical narrator, and GNN playground.
"""

import networkx as nx
from services.classifier import classify_graph
from oracle import discover_all_laws, discover_polynomial_laws, detect_anomalies
from services.narrator import generate_narrative
from ml_engine import compute_gnn_comparison


def test_graph_classifier():
    # Tree
    T = nx.path_graph(5)
    res_t = classify_graph(T)
    assert res_t["is_tree"] is True
    assert res_t["is_bipartite"] is True
    assert res_t["family_name"] == "Tree"

    # Cycle
    C = nx.cycle_graph(6)
    res_c = classify_graph(C)
    assert res_c["is_regular"] is True
    assert res_c["regular_degree"] == 2
    assert "Cycle" in res_c["family_name"]
    assert res_c["girth"] == 6

    # Complete graph
    K = nx.complete_graph(4)
    res_k = classify_graph(K)
    assert res_k["is_regular"] is True
    assert "Complete" in res_k["family_name"]


def test_oracle_polynomial_and_anomalies():
    # Synthetic batch of random graphs
    from batch import generate_batch_data
    batch = generate_batch_data(25)
    res = discover_all_laws(batch)

    assert "conjectures" in res
    assert "linear_conjectures" in res
    assert "polynomial_conjectures" in res
    assert "anomalies" in res
    assert len(res["anomalies"]) > 0
    # Every anomaly has reason and score
    first_anom = res["anomalies"][0]
    assert "reason" in first_anom
    assert "anomaly_score" in first_anom


def test_mathematical_narrator():
    # Topology narrative
    sample_topology = {
        "metadata": {"num_nodes": 6, "num_edges": 7, "is_connected": True, "is_planar": True},
        "topology": {
            "betti_numbers": [1, 2, 0],
            "algebraic_connectivity": 0.85,
            "spectral_gap": 0.42,
            "cheeger_bounds": {"lower": 0.21, "upper": 0.92},
            "triangles": [[0, 1, 2]],
            "graph_family": {"family_name": "Planar Graph"},
        },
    }
    narrative = generate_narrative("topology", sample_topology)
    assert "β₀=1" in narrative.summary
    assert len(narrative.key_insights) >= 3
    assert len(narrative.theoretical_connections) >= 2
    assert len(narrative.open_questions) >= 2

    # Algebraic narrative
    sample_alg = {
        "singularities": [],
        "is_smooth": True,
        "nullstellensatz_certified": True,
    }
    alg_narrative = generate_narrative("algebraic", sample_alg, formula="x^2 + y^2 + z^2 - 1")
    assert "globally smooth" in alg_narrative.summary


def test_gnn_playground():
    G = nx.cycle_graph(5)

    # GCN
    res_gcn = compute_gnn_comparison(G, "GCN")
    assert len(res_gcn["saliency_scores"]) == 5
    assert len(res_gcn["embeddings_2d"]) == 5

    # GAT
    res_gat = compute_gnn_comparison(G, "GAT")
    assert len(res_gat["attention_weights"]) > 0
    assert "GAT" in res_gat["model_type"]

    # GraphSAGE
    res_sage = compute_gnn_comparison(G, "GraphSAGE")
    assert "GraphSAGE" in res_sage["model_type"]
    assert len(res_sage["saliency_scores"]) == 5


if __name__ == "__main__":
    test_graph_classifier()
    print("test_graph_classifier passed!")
    test_oracle_polynomial_and_anomalies()
    print("test_oracle_polynomial_and_anomalies passed!")
    test_mathematical_narrator()
    print("test_mathematical_narrator passed!")
    test_gnn_playground()
    print("test_gnn_playground passed!")
    print("ALL PHASE 3 TESTS PASSED!")
