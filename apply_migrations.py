"""
Apply database migrations
"""
import sqlite3
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_PATH = Path(__file__).parent / "backend" / "database" / "business.db"
MIGRATIONS_DIR = Path(__file__).parent / "migrations"

def apply_migration(db_path: Path, migration_file: Path):
    """Apply a single migration file"""
    logger.info(f"Applying migration: {migration_file.name}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        
        # Read migration SQL
        with open(migration_file, 'r') as f:
            sql = f.read()
        
        # Execute migration
        cursor = conn.cursor()
        cursor.executescript(sql)
        conn.commit()
        
        # Get result if available
        try:
            result = cursor.fetchone()
            if result:
                logger.info(f"  Result: {result[0]}")
        except:
            pass
        
        conn.close()
        logger.info(f"✓ Migration {migration_file.name} applied successfully")
        return True
        
    except Exception as e:
        logger.error(f"✗ Migration {migration_file.name} failed: {e}")
        return False

def main():
    """Apply all migrations"""
    logger.info("=" * 60)
    logger.info("Database Migration Tool")
    logger.info("=" * 60)
    logger.info(f"Database: {DATABASE_PATH}")
    logger.info(f"Migrations: {MIGRATIONS_DIR}")
    logger.info("")
    
    if not DATABASE_PATH.exists():
        logger.error(f"Database not found: {DATABASE_PATH}")
        return
    
    # Apply migrations in order
    migrations = [
        MIGRATIONS_DIR / "add_indexes.sql",
        MIGRATIONS_DIR / "add_constraints.sql"
    ]
    
    success_count = 0
    for migration in migrations:
        if migration.exists():
            if apply_migration(DATABASE_PATH, migration):
                success_count += 1
        else:
            logger.warning(f"Migration file not found: {migration}")
    
    logger.info("")
    logger.info("=" * 60)
    logger.info(f"Migration complete: {success_count}/{len(migrations)} successful")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
