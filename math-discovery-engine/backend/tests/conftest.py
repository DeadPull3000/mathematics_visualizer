"""
Test fixtures and configuration for pytest.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app import app


@pytest.fixture(scope="session")
def client():
    """Shared FastAPI TestClient for HTTP endpoint testing."""
    with TestClient(app) as test_client:
        yield test_client
