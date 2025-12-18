"""
FastAPI Database Connection Manager
Handles SQLite connection with WAL mode
"""
import sqlite3
from pathlib import Path
from typing import Generator

DATABASE_PATH = Path(__file__).parent.parent / "database" / "business.db"

def get_connection() -> sqlite3.Connection:
    """Get a new database connection with row factory"""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Dependency for FastAPI routes"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
