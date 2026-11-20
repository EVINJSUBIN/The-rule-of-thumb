import sqlite3
import os
from config import DATABASE_PATH

def get_db_connection():
    """
    Returns an open connection to the SQLite database.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes database tables if they do not already exist.
    """
    # Ensure the parent directory exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. AI Audit Log Table (Tracks AI reliance & MCP calls)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            tool_name TEXT NOT NULL,
            action TEXT,
            notes TEXT
        );
    """)
    
    # 2. Manual Coding Sessions Table (Tracks keystroke/active coding time)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coding_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            duration_seconds INTEGER DEFAULT 0,
            project_name TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS typing_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            key_count INTEGER NOT NULL,
            source TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS error_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_text TEXT NOT NULL,
            match_json TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            title TEXT NOT NULL,
            detail TEXT,
            source TEXT,
            status TEXT DEFAULT 'open'
        );
    """)
    
    conn.commit()
    conn.close()
    print(f"[*] SQLite Database initialized at: {DATABASE_PATH}")

if __name__ == "__main__":
    init_db()
