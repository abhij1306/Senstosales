"""
Database connection and initialization
"""
import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.pool import StaticPool
from config.settings import DB_PATH, SQLITE_PRAGMAS

def get_engine():
    """Get SQLAlchemy engine with proper settings"""
    engine = create_engine(
        f"sqlite:///{DB_PATH}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    
    # Set pragmas
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        for pragma, value in SQLITE_PRAGMAS.items():
            cursor.execute(f"PRAGMA {pragma} = {value}")
        cursor.close()
    
    return engine

def get_connection():
    """Get raw SQLite connection"""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # Set pragmas
    for pragma, value in SQLITE_PRAGMAS.items():
        conn.execute(f"PRAGMA {pragma} = {value}")
    
    return conn

def init_database():
    """Initialize database from migration file"""
    schema_path = Path(__file__).parent.parent / "migrations" / "v1_initial.sql"
    
    if not schema_path.exists():
        raise FileNotFoundError(f"Migration file not found: {schema_path}")
    
    conn = get_connection()
    
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
    
    conn.executescript(schema_sql)
    conn.commit()
    
    # --- Auto-Migration for Schema Updates ---
    try:
        conn.execute("SELECT drg_no FROM purchase_order_items LIMIT 1")
    except sqlite3.OperationalError:
        print("⚡ Performing Migration: Adding drg_no column...")
        conn.execute("ALTER TABLE purchase_order_items ADD COLUMN drg_no TEXT")
        conn.commit()
    # ----------------------------------------
    
    conn.close()
    
    print(f"✅ Database initialized at: {DB_PATH}")

def check_database_exists():
    """Check if database file exists"""
    return DB_PATH.exists()
