"""
FastAPI Database Connection Manager
Handles SQLite connection with WAL mode and explicit transactions
"""

import sqlite3
import sys
from pathlib import Path
from typing import Generator
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

# Determine Base Directory (Handles PyInstaller vs Script)
if getattr(sys, "frozen", False):
    # Running as compiled exe
    # Use the directory of the executable for the database
    BASE_DIR = Path(sys.executable).parent
    # Use _MEIPASS for internal assets like migrations
    INTERNAL_DIR = Path(sys._MEIPASS)
else:
    # Running as script
    # Handle case where script is run from project root vs backend dir
    current_path = Path(__file__).resolve()
    if current_path.parent.name == "app":
        # running from backend/app
        BASE_DIR = current_path.parent.parent
    else:
        # fallback or other structure
        BASE_DIR = current_path.parent.parent

# For production: database is in root/db/, migrations in root/migrations/
# BASE_DIR is backend/ directory, so parent is root/
INTERNAL_DIR = BASE_DIR.parent
DATABASE_DIR = INTERNAL_DIR / "db"
DATABASE_PATH = DATABASE_DIR / "business.db"
MIGRATIONS_DIR = INTERNAL_DIR / "migrations"


def init_db(conn: sqlite3.Connection):
    """Initialize database with schema from migrations"""
    logger.info("Initializing new database...")

    # Order of migrations to apply
    migration_files = [
        "v1_initial.sql",
        "002_add_alerts.sql",
        "003_add_drawing_number_and_po_notes.sql",
        "004_complete_schema_alignment.sql",
        "v4_add_srv_tables.sql",
        "005_add_srv_po_found.sql",
        "006_fix_srv_schema.sql",
        "007_add_missing_srv_fields.sql",
        "008_add_extended_srv_fields.sql",
        "009_add_lot_no_to_dc_items.sql",
        "add_invoice_enhancements.sql",
        "add_indexes.sql",
        "add_constraints.sql",
        "012_add_rejected_qty_to_poi.sql",
        "013_add_document_sequences.sql",
        "014_add_settings.sql",
        "015_add_unique_constraints.sql",
        "016_atomic_accounting_triggers.sql",
        "017_fy_wise_unique_constraints.sql",
        "018_standardize_numeric_precision.sql",
    ]

    cursor = conn.cursor()
    for filename in migration_files:
        file_path = MIGRATIONS_DIR / filename
        if file_path.exists():
            logger.info(f"Applying migration: {filename}")
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    sql_script = f.read()
                cursor.executescript(sql_script)
            except Exception as e:
                logger.error(f"Failed to apply {filename}: {e}")
                raise
        else:
            logger.warning(f"Migration file not found: {file_path}")

    conn.commit()
    logger.info("Database initialization complete.")


def validate_database_path():
    """Ensure database directory exists"""
    if not DATABASE_DIR.exists():
        print(f"Creating database directory at {DATABASE_DIR}")
        DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    if not DATABASE_PATH.exists():
        print(f"WARNING: Database file not found at {DATABASE_PATH}")
        # Connect and initialize
        try:
            conn = sqlite3.connect(str(DATABASE_PATH))
            init_db(conn)
            conn.close()
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    else:
        logger.info(f"Database path validated: {DATABASE_PATH}")


def get_connection() -> sqlite3.Connection:
    """Get a new database connection with row factory"""
    try:
        conn = sqlite3.connect(str(DATABASE_PATH), check_same_thread=False)
        conn.row_factory = sqlite3.Row

        # CRITICAL: Enable Foreign Keys and WAL mode
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")

        # CRITICAL FIX: Commit to persist PRAGMA settings
        conn.commit()

        # Verify Foreign Keys are actually enabled
        fk_status = conn.execute("PRAGMA foreign_keys").fetchone()[0]
        if fk_status != 1:
            logger.error(
                f"CRITICAL: Foreign Keys failed to enable! Status: {fk_status}"
            )
            raise RuntimeError(
                "Foreign Key enforcement failed - database integrity at risk"
            )

        logger.debug(f"Connection established: FK={fk_status}, WAL=enabled")
        return conn
    except sqlite3.Error as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Dependency for FastAPI routes"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
        logger.debug("Transaction committed successfully")
    except Exception as e:
        conn.rollback()
        logger.error(f"Transaction rolled back due to error: {e}")
        raise
    finally:
        conn.close()
        logger.debug("Database connection closed")


@contextmanager
def db_transaction(conn: sqlite3.Connection):
    """
    Explicit transaction context manager
    Use this for operations that require atomic multi-step writes

    Example:
        with db_transaction(db):
            db.execute("INSERT INTO table1 ...")
            db.execute("INSERT INTO table2 ...")
    """
    try:
        logger.debug("Starting explicit transaction")
        yield conn
        conn.commit()
        logger.debug("Explicit transaction committed")
    except Exception as e:
        conn.rollback()
        logger.error(f"Explicit transaction rolled back: {e}")
        raise
