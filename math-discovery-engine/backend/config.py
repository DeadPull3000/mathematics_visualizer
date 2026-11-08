"""
Application Configuration
=========================
Centralized settings management for the Mathematical Discovery Engine.
"""

from typing import List


class Settings:
    PROJECT_NAME: str = "Visual Mathematical Discovery Engine"
    VERSION: str = "0.3.0"
    DESCRIPTION: str = (
        "Multi-domain mathematical engine providing exact symbolic computation, "
        "spectral topology, persistent homology, and conjecture discovery."
    )
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    # Mathematical Engine Limits
    PLANARITY_EDGE_LIMIT: int = 1000
    ALGEBRAIC_SOLVE_TIMEOUT_SEC: float = 5.0
    DEFAULT_BATCH_MAX_SAMPLES: int = 500


settings = Settings()
