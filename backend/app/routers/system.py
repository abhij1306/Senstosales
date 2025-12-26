"""
System Router - Administrative Endpoints
Handles database reset and system maintenance
"""

from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from app.db import get_db
import logging

router = APIRouter(tags=["System"])
logger = logging.getLogger(__name__)


@router.post("/reset-db")
def reset_database(db: sqlite3.Connection = Depends(get_db)):
    """
    DESTRUCTIVE: Reset all business data, preserve master tables
    WARNING: This cannot be undone!
    """
    try:
        logger.warning("⚠️  DATABASE RESET INITIATED")

        # CRITICAL: Disable Foreign Keys during deletion to avoid constraint violations
        db.execute("PRAGMA foreign_keys = OFF")

        # Get all tables except masters and SQLite internals
        tables_query = """
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT IN ('hsn_master', 'consignee_master', 'sqlite_sequence')
            AND name NOT LIKE 'sqlite_%'
        """
        tables = db.execute(tables_query).fetchall()

        deleted_tables = []

        # Delete all data from business tables
        for table_row in tables:
            table_name = table_row[0]
            try:
                db.execute(f"DELETE FROM {table_name}")
                deleted_tables.append(table_name)
                logger.info(f"✓ Cleared table: {table_name}")
            except sqlite3.Error as e:
                logger.error(f"✗ Failed to clear {table_name}: {e}")
                # Don't abort - try to clear other tables

        # Reinitialize document_sequences with proper values
        db.execute(
            "INSERT OR REPLACE INTO document_sequences (seq_key, current_val, prefix) VALUES ('DC', 0, 'DC'), ('INV', 0, 'INV')"
        )

        db.commit()

        # CRITICAL: Re-enable Foreign Keys and WAL
        db.execute("PRAGMA journal_mode = WAL")
        db.execute("PRAGMA foreign_keys = ON")

        # Verify FK re-enabled
        fk_status = db.execute("PRAGMA foreign_keys").fetchone()[0]
        if fk_status != 1:
            logger.error("CRITICAL: Foreign Keys failed to re-enable after reset!")

        logger.warning(
            f"✅ DATABASE RESET COMPLETE - {len(deleted_tables)} tables cleared, FK re-enabled"
        )

        return {
            "status": "reset_successful",
            "message": f"Database reset complete. {len(deleted_tables)} tables cleared.",
            "tables_cleared": deleted_tables,
            "preserved": ["hsn_master", "consignee_master"],
            "foreign_keys_status": "enabled" if fk_status == 1 else "FAILED",
        }

    except Exception as e:
        logger.error(f"❌ Database reset failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")
