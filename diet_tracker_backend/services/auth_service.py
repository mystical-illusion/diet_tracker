import bcrypt
import jwt
import datetime
import os
from database.database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "diet_secret")

class AuthService:
    
    @staticmethod
    def hash_password(password):
        # 🎯 CRITICAL FIX: Decode the binary hash to a clean UTF-8 string before saving to SQLite
        hashed_bytes = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        )
        return hashed_bytes.decode("utf-8")
    
    @staticmethod
    def verify_password(password, hashed):
        # 🎯 CRITICAL FIX: Ensure the value from SQLite is encoded back into bytes for bcrypt to read safely
        if isinstance(hashed, str):
            hashed = hashed.encode("utf-8")
        
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                hashed
            )
        except Exception as e:
            print(f"Bcrypt verification failed internally: {str(e)}")
            return False
    
    @staticmethod
    def create_user(username, email, password):
        hashed = AuthService.hash_password(password)
        conn = get_db()
        conn.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, hashed)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def find_user_by_email(email):
        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()
        conn.close()
        return user
    
    @staticmethod
    def generate_token(user_id):
        # 🎯 UPDATED: Handles clean expiration generation securely
        token = jwt.encode({
            "user_id": user_id,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return token