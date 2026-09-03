from flask import Blueprint, jsonify, request
from database.database import get_db
from services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


# 1. Login Endpoint
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    
    # Accept identifier whether sent as "email" or "username"
    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Email/Username and password required"}), 400

    conn = get_db()
    # Check against both username and email columns
    user = conn.execute(
        """
        SELECT id, username, password, COALESCE(email, '') as email 
        FROM users 
        WHERE email = ? OR username = ?
        """,
        (identifier, identifier)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid email/username or password"}), 401

    if not AuthService.verify_password(password, user["password"]):
        return jsonify({"error": "Invalid email/username or password"}), 401

    token = AuthService.generate_token(user["id"])

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    }), 200
# 2. Register Endpoint
@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    email    = data.get("email", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Username already taken"}), 409

    hashed_pw = AuthService.hash_password(password)
    cursor = conn.execute(
        "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
        (username, hashed_pw, email)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    token = AuthService.generate_token(user_id)

    return jsonify({
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user_id,
            "username": username,
            "email": email
        }
    }), 201


# 3. Change Password Endpoint
@auth_bp.route("/change-password", methods=["POST", "OPTIONS"])
def change_password():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    user_id      = data.get("user_id")
    current_pass = data.get("current_password")
    new_pass     = data.get("new_password")

    if not all([user_id, current_pass, new_pass]):
        return jsonify({"error": "All fields are required"}), 400

    if len(new_pass) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400

    if current_pass == new_pass:
        return jsonify({"error": "New password cannot be the same as current password"}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if not AuthService.verify_password(current_pass, user["password"]):
        conn.close()
        return jsonify({"error": "Current password incorrect"}), 401

    try:
        new_hashed = AuthService.hash_password(new_pass)
        conn.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            (new_hashed, user_id)
        )
        conn.commit()
        return jsonify({"message": "Password changed successfully!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update password: {str(e)}"}), 500
    finally:
        conn.close()


# 4. Delete Account Endpoint (Cascading Clean-up)
@auth_bp.route("/delete-account", methods=["DELETE", "OPTIONS"])
def delete_account():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    user_id  = data.get("user_id")
    password = data.get("password")

    if not user_id or not password:
        return jsonify({"error": "User ID and password are required"}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if not AuthService.verify_password(password, user["password"]):
        conn.close()
        return jsonify({"error": "Incorrect password"}), 401

    try:
        conn.execute("DELETE FROM meals WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM daily_logs WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return jsonify({"message": "Account and all associated records deleted successfully!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete account: {str(e)}"}), 500
    finally:
        conn.close()