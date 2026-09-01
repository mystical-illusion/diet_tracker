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
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            username  TEXT    NOT NULL,
            email     TEXT    DEFAULT '',
            password  TEXT    NOT NULL,
            age       INTEGER DEFAULT 25,
            gender    TEXT    DEFAULT 'female',
            height_cm REAL    DEFAULT 165.0,
            weight_kg REAL    DEFAULT 65.0
        )
    """)
    
    # 2. Meals table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER NOT NULL,
            food      TEXT    NOT NULL,
            calories  INTEGER NOT NULL,
            protein   REAL    DEFAULT 0.0,
            carbs     REAL    DEFAULT 0.0,
            fat       REAL    DEFAULT 0.0,
            meal_type TEXT    DEFAULT 'general',
            time      TEXT    DEFAULT '',
            date      TEXT    DEFAULT (date('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 3. Goals table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id           INTEGER NOT NULL UNIQUE,
            daily_goal        INTEGER NOT NULL DEFAULT 2000,
            protein_g         INTEGER DEFAULT 120,
            carbs_g           INTEGER DEFAULT 220,
            fat_g             INTEGER DEFAULT 60,
            water_ml          INTEGER DEFAULT 2500,
            health_objective  TEXT    DEFAULT 'maintenance',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # 4. Daily Logs / Hydration tracking
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_logs (
            user_id INTEGER NOT NULL,
            date    TEXT    NOT NULL,
            water   INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 5. Health Conditions & Symptom Tracking
    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_logs (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL,
            date           TEXT    NOT NULL,
            condition_type TEXT    NOT NULL,
            severity       TEXT    DEFAULT 'mild',
            notes          TEXT    DEFAULT '',
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 6. Exercise & Yoga Logs
    conn.execute("""
        CREATE TABLE IF NOT EXISTS exercise_logs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            date            TEXT    NOT NULL,
            activity_type   TEXT    NOT NULL,
            activity_name   TEXT    NOT NULL,
            duration_min    INTEGER NOT NULL DEFAULT 0,
            calories_burned INTEGER NOT NULL DEFAULT 0,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # -------------------------------------------------------------
    # Migrations: Safely add missing columns to existing databases
    # -------------------------------------------------------------

    # Users table migrations
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

    # Meals table migrations
    meal_cursor = conn.execute("PRAGMA table_info(meals)")
    meal_cols = [col["name"] for col in meal_cursor.fetchall()]
    if "meal_type" not in meal_cols:
        conn.execute("ALTER TABLE meals ADD COLUMN meal_type TEXT DEFAULT 'general'")
    if "protein" not in meal_cols:
        conn.execute("ALTER TABLE meals ADD COLUMN protein REAL DEFAULT 0.0")
    if "carbs" not in meal_cols:
        conn.execute("ALTER TABLE meals ADD COLUMN carbs REAL DEFAULT 0.0")
    if "fat" not in meal_cols:
        conn.execute("ALTER TABLE meals ADD COLUMN fat REAL DEFAULT 0.0")
    if "time" not in meal_cols:
        conn.execute("ALTER TABLE meals ADD COLUMN time TEXT DEFAULT ''")

    # Goals table migrations
    goal_cursor = conn.execute("PRAGMA table_info(goals)")
    goal_cols = [col["name"] for col in goal_cursor.fetchall()]
    if "protein_g" not in goal_cols:
        conn.execute("ALTER TABLE goals ADD COLUMN protein_g INTEGER DEFAULT 120")
    if "carbs_g" not in goal_cols:
        conn.execute("ALTER TABLE goals ADD COLUMN carbs_g INTEGER DEFAULT 220")
    if "fat_g" not in goal_cols:
        conn.execute("ALTER TABLE goals ADD COLUMN fat_g INTEGER DEFAULT 60")
    if "water_ml" not in goal_cols:
        conn.execute("ALTER TABLE goals ADD COLUMN water_ml INTEGER DEFAULT 2500")
    if "health_objective" not in goal_cols:
        conn.execute("ALTER TABLE goals ADD COLUMN health_objective TEXT DEFAULT 'maintenance'")

    conn.commit()
    conn.close()
    print("✅ Database initialized and verified successfully.")