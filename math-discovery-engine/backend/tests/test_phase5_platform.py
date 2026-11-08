"""
Tests for Phase 5: Platform Features, Domain Registry, and Session Persistence
==============================================================================
"""

import storage
from domains.registry import DomainManifest, DomainRegistry


def test_domain_registry():
    reg = DomainRegistry()
    domains = reg.list_all()
    assert len(domains) >= 8

    # Verify topology domain
    top = reg.get("topology")
    assert top is not None
    assert top.name.startswith("Spectral Graph Theory")

    # Register custom domain
    custom = DomainManifest(
        id="tropical-geometry",
        name="Tropical Geometry & Amoebas",
        description="Min-plus algebra and piecewise-linear tropical curves.",
        category="Algebraic Geometry",
        color="#E07A5F",
        icon="🌴",
        endpoint="/api/process-tropical",
    )
    reg.register(custom)
    assert reg.get("tropical-geometry") is not None
    assert len(reg.list_all()) >= 9


def test_storage_sessions_and_explorations():
    # 1. Create session
    sess = storage.create_session("Quantum Graph Exploration")
    sess_id = sess["id"]
    assert sess["title"] == "Quantum Graph Exploration"

    # 2. Save exploration into session
    expl = storage.save_exploration(
        session_id=sess_id,
        domain="topology",
        input_type="formula",
        raw_data="C_6",
        result_data={"nodes": [0, 1, 2, 3, 4, 5], "edges": [[0, 1], [1, 2]]},
    )
    assert expl["session_id"] == sess_id
    assert expl["domain"] == "topology"

    # 3. Retrieve session with explorations
    fetched = storage.get_session(sess_id)
    assert fetched is not None
    assert fetched["exploration_count"] == 1
    assert fetched["explorations"][0]["input_type"] == "formula"
    assert fetched["explorations"][0]["result"]["nodes"] == [0, 1, 2, 3, 4, 5]

    # 4. List sessions
    all_sess = storage.list_sessions()
    ids = [s["id"] for s in all_sess]
    assert sess_id in ids

    # 5. Delete session
    assert storage.delete_session(sess_id) is True
    assert storage.get_session(sess_id) is None


if __name__ == "__main__":
    test_domain_registry()
    print("test_domain_registry passed!")
    test_storage_sessions_and_explorations()
    print("test_storage_sessions_and_explorations passed!")
    print("ALL PHASE 5 TESTS COMPLETED SUCCESSFULLY!")
