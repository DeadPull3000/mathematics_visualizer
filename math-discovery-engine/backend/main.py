"""
Visual Mathematical Discovery Engine - Server Entrypoint
=========================================================
Runs the FastAPI application using uvicorn.

Usage:
    uvicorn main:app --reload --port 8000
    python main.py
"""

from app import app, create_app

__all__ = ["app", "create_app"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
