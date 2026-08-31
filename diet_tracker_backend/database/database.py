import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE = os.getenv("DATABASE", "diet_tracker.db")

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    
    # 1. Users table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT    NOT NULL,
            email    TEXT    DEFAULT '',
            password TEXT    NOT NULL,
            age      INTEGER DEFAULT 25,
            gender   TEXT    DEFAULT 'female',
            height_cm REAL   DEFAULT 165.0,
            weight_kg REAL   DEFAULT 65.0
        )
    """)
    
    # 2. Meals table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER NOT NULL,
            food      TEXT    NOT NULL,
            calories  INTEGER NOT NULL,
            meal_type TEXT    DEFAULT 'snack',
            date      TEXT    DEFAULT (date('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 3. Goals table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL UNIQUE,
            daily_goal INTEGER NOT NULL DEFAULT 2000,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # 4. Daily Logs / Water tracking
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_logs (
            user_id INTEGER NOT NULL,
            date    TEXT    NOT NULL,
            water   INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 5. Check and migrate missing columns in users table
    cursor = conn.execute("PRAGMA table_info(users)")
    user_cols = [col["name"] for col in cursor.fetchall()]

    if "height_cm" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN height_cm REAL DEFAULT 165.0")
    if "weight_kg" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN weight_kg REAL DEFAULT 65.0")
    if "age" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 25")
    if "gender" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'female'")
    if "email" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")

    # 6. Check and migrate missing meal_type in meals table
    meal_cursor = conn.execute("PRAGMA table_info(meals)")
    meal_cols = [col["name"] for col in meal_cursor.fetchall()]
    if "meal_type" not in meal_cols:
        conn.execute("ALTER TABLE meals ADD COLUMN meal_type TEXT DEFAULT 'snack'")

    conn.commit()
    conn.close()
    print("✅ Database initialized and verified successfully.")