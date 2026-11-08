"""
SQLite Exploration Ledger & Session Persistence Engine (Phase 5)
================================================================
Thread-safe persistence for laboratory sessions, user explorations,
and mathematical discoveries across browser restarts.
"""

from __future__ import annotations
import json
import logging
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

log = logging.getLogger("math-engine.storage")

# Ensure persistent data directory exists
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "explorations.db"


def _get_connection() -> sqlite3.Connection:
    """Creates a configured connection with foreign keys enabled."""
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize schema if not existing."""
    with _get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS explorations (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                domain TEXT NOT NULL,
                input_type TEXT NOT NULL,
                raw_data TEXT NOT NULL,
                result_json TEXT NOT NULL,
                created_at REAL NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)
        conn.commit()
    log.info("Initialized SQLite database at %s", DB_PATH)


# Initialize schema on import
init_db()


def create_session(title: str = "Untitled Session") -> Dict[str, Any]:
    """Create a new exploration session."""
    session_id = str(uuid.uuid4())[:8]
    now = time.time()
    with _get_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (session_id, title.strip() or "Untitled Session", now, now),
        )
        conn.commit()
    return {
        "id": session_id,
        "title": title.strip() or "Untitled Session",
        "created_at": now,
        "updated_at": now,
        "exploration_count": 0,
    }


def list_sessions() -> List[Dict[str, Any]]:
    """List all exploration sessions sorted by most recent activity."""
    with _get_connection() as conn:
        cursor = conn.execute("""
            SELECT s.id, s.title, s.created_at, s.updated_at, COUNT(e.id) AS exploration_count
            FROM sessions s
            LEFT JOIN explorations e ON s.id = e.session_id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
        """)
        return [dict(row) for row in cursor.fetchall()]


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Fetch session details along with all recorded mathematical explorations."""
    with _get_connection() as conn:
        s_cursor = conn.execute(
            "SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?",
            (session_id,),
        )
        s_row = s_cursor.fetchone()
        if not s_row:
            return None

        e_cursor = conn.execute(
            "SELECT id, session_id, domain, input_type, raw_data, result_json, created_at FROM explorations WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        )
        explorations = []
        for r in e_cursor.fetchall():
            d = dict(r)
            try:
                d["result"] = json.loads(d.pop("result_json"))
            except Exception:
                d["result"] = {}
            explorations.append(d)

        res = dict(s_row)
        res["explorations"] = explorations
        res["exploration_count"] = len(explorations)
        return res


def delete_session(session_id: str) -> bool:
    """Delete a session and all its associated explorations."""
    with _get_connection() as conn:
        cursor = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0


def save_exploration(
    session_id: str,
    domain: str,
    input_type: str,
    raw_data: str,
    result_data: Any,
) -> Dict[str, Any]:
    """Save an exploration result into a session."""
    expl_id = str(uuid.uuid4())[:8]
    now = time.time()
    result_json = json.dumps(result_data) if not isinstance(result_data, str) else result_data

    with _get_connection() as conn:
        # Check session exists or create if missing
        s = conn.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not s:
            conn.execute(
                "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (session_id, f"Session {session_id}", now, now),
            )

        conn.execute(
            """
            INSERT INTO explorations (id, session_id, domain, input_type, raw_data, result_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (expl_id, session_id, domain, input_type, raw_data, result_json, now),
        )
        conn.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (now, session_id),
        )
        conn.commit()

    return {
        "id": expl_id,
        "session_id": session_id,
        "domain": domain,
        "input_type": input_type,
        "raw_data": raw_data,
        "created_at": now,
    }
