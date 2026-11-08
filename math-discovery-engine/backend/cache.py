"""
Computation Cache Engine (Phase 4: Performance & Scale)
=======================================================
Thread-safe LRU & TTL cache for deterministic mathematical evaluations.
Guarantees sub-millisecond responses for identical topological/algebraic queries
while strictly bounding in-memory footprint.
"""

from __future__ import annotations
import hashlib
import json
import logging
import threading
import time
from collections import OrderedDict
from typing import Any, Dict, Optional, Tuple

log = logging.getLogger("math-engine.cache")


class LRUTTLCache:
    """
    Thread-safe Least-Recently-Used (LRU) cache with Time-To-Live (TTL) expiration.
    """

    def __init__(self, max_size: int = 1024, default_ttl_seconds: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl_seconds
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def get(self, key: str) -> Optional[Any]:
        """Retrieve an item from cache if present and not expired."""
        with self._lock:
            if key not in self._cache:
                self.misses += 1
                return None

            value, expires_at = self._cache[key]
            if time.time() > expires_at:
                # Expired
                del self._cache[key]
                self.misses += 1
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self.hits += 1
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Store an item in the cache with expiration."""
        ttl_seconds = ttl if ttl is not None else self.default_ttl
        expires_at = time.time() + ttl_seconds

        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = (value, expires_at)

            # Evict oldest if exceeding max_size
            while len(self._cache) > self.max_size:
                self._cache.popitem(last=False)
                self.evictions += 1

    def clear(self) -> None:
        """Purge all cache entries."""
        with self._lock:
            self._cache.clear()
            self.hits = 0
            self.misses = 0
            self.evictions = 0

    def stats(self) -> Dict[str, Any]:
        """Return cache health metrics and hit-ratio."""
        with self._lock:
            total_requests = self.hits + self.misses
            hit_ratio = round(self.hits / total_requests, 4) if total_requests > 0 else 0.0
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self.hits,
                "misses": self.misses,
                "evictions": self.evictions,
                "total_requests": total_requests,
                "hit_ratio": hit_ratio,
            }


# Global singleton cache instance
math_cache = LRUTTLCache(max_size=2048, default_ttl_seconds=3600)


def generate_cache_key(path: str, body: bytes) -> str:
    """Generates a deterministic SHA-256 fingerprint for a mathematical computation request."""
    hasher = hashlib.sha256()
    hasher.update(path.encode("utf-8"))
    hasher.update(b"::")
    hasher.update(body)
    return hasher.hexdigest()
