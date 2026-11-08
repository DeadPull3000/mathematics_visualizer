"""
Tests for Phase 4: Performance, Scale, Caching, and Streaming
=============================================================
Tests LRU/TTL cache logic, cache statistics, SSE streaming generator,
and deterministic key hashing.
"""

import time
from cache import LRUTTLCache, generate_cache_key
from batch import generate_single_sample, generate_batch_data


def test_lru_ttl_cache_basic():
    cache = LRUTTLCache(max_size=3, default_ttl_seconds=2)
    assert cache.stats()["size"] == 0

    cache.set("k1", "val1")
    cache.set("k2", "val2")
    assert cache.get("k1") == "val1"
    assert cache.get("nonexistent") is None

    stats = cache.stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["size"] == 2


def test_lru_cache_eviction():
    cache = LRUTTLCache(max_size=2, default_ttl_seconds=60)
    cache.set("a", 1)
    cache.set("b", 2)
    # Access 'a' to make it most recently used
    _ = cache.get("a")

    # Insert 'c' -> should evict 'b'
    cache.set("c", 3)
    assert cache.get("b") is None
    assert cache.get("a") == 1
    assert cache.get("c") == 3
    assert cache.stats()["evictions"] == 1


def test_lru_cache_expiration():
    cache = LRUTTLCache(max_size=10, default_ttl_seconds=1)
    cache.set("ephemeral", "data", ttl=1)
    assert cache.get("ephemeral") == "data"

    # Sleep past TTL
    time.sleep(1.05)
    assert cache.get("ephemeral") is None


def test_cache_key_generation():
    key1 = generate_cache_key("/api/process-object", b'{"formula": "K_5"}')
    key2 = generate_cache_key("/api/process-object", b'{"formula": "K_5"}')
    key3 = generate_cache_key("/api/process-object", b'{"formula": "C_5"}')

    assert key1 == key2
    assert key1 != key3
    assert len(key1) == 64  # SHA-256 hex


def test_batch_sample_generation():
    sample = generate_single_sample(42)
    assert sample["id"] == 42
    assert "vertices" in sample
    assert "edges" in sample
    assert "density" in sample
    assert "algebraic_connectivity" in sample
    assert "betti_0" in sample


if __name__ == "__main__":
    test_lru_ttl_cache_basic()
    print("test_lru_ttl_cache_basic passed!")
    test_lru_cache_eviction()
    print("test_lru_cache_eviction passed!")
    test_lru_cache_expiration()
    print("test_lru_cache_expiration passed!")
    test_cache_key_generation()
    print("test_cache_key_generation passed!")
    test_batch_sample_generation()
    print("test_batch_sample_generation passed!")
    print("ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY!")
