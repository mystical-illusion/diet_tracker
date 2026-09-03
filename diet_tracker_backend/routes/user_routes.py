from flask import Blueprint, jsonify, request
from database.database import get_db
from services.auth_service import AuthService

user_bp = Blueprint("user", __name__, url_prefix="/user")


# 1. GET User Details & Profile Stats
@user_bp.route("/<int:user_id>", methods=["GET", "OPTIONS"])
def get_user(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    conn = get_db()
    user = conn.execute(
        "SELECT id, username, COALESCE(email, '') as email FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({"message": "user not found!"}), 404

    # Fetch stats
    total_meals = conn.execute(
        "SELECT COUNT(*) as count FROM meals WHERE user_id = ?",
        (user_id,)
    ).fetchone()["count"]

    total_days = conn.execute(
        "SELECT COUNT(DISTINCT date) as count FROM meals WHERE user_id = ?",
        (user_id,)
    ).fetchone()["count"]

    conn.close()

    return jsonify({
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        },
        "stats": {
            "total_meals": total_meals,
            "total_days": total_days
        }
    }), 200


# 2. PUT Update User Profile (Username & Email)
@user_bp.route("/<int:user_id>", methods=["PUT", "OPTIONS"])
def update_user(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    new_username = data.get("username", "").strip()
    new_email = data.get("email", "").strip()

    if not new_username:
        return jsonify({"error": "username cannot be empty"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({"message": "user not found!"}), 404

    try:
        conn.execute(
            "UPDATE users SET username = ?, email = ? WHERE id = ?",
            (new_username, new_email, user_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "user updated!"}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": "Username already taken or database error"}), 400


# 3. POST Change Password
@user_bp.route("/change-password", methods=["POST", "OPTIONS"])
def change_password():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    user_id      = data.get("user_id")
    current_pass = data.get("current_password")
    new_pass     = data.get("new_password")

    if not all([user_id, current_pass, new_pass]):
        return jsonify({"error": "all fields required"}), 400

    if len(new_pass) < 6:
        return jsonify({"error": "new password must be at least 6 characters"}), 400

    if current_pass == new_pass:
        return jsonify({"error": "new password cannot be identical to current password"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "user not found"}), 404

    if not AuthService.verify_password(current_pass, user["password"]):
        conn.close()
        return jsonify({"error": "current password incorrect"}), 401

    try:
        new_hashed = AuthService.hash_password(new_pass)
        conn.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            (new_hashed, user_id)
        )
        conn.commit()
        return jsonify({"message": "password changed!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update password: {str(e)}"}), 500
    finally:
        conn.close()


# 4. DELETE User Account and Associated Data
@user_bp.route("/delete-account", methods=["DELETE", "OPTIONS"])
def delete_account():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    user_id  = data.get("user_id")
    password = data.get("password")

    if not user_id or not password:
        return jsonify({"error": "user_id and password required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "user not found"}), 404

    if not AuthService.verify_password(password, user["password"]):
        conn.close()
        return jsonify({"error": "incorrect password"}), 401

    try:
        conn.execute("DELETE FROM meals WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM daily_logs WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return jsonify({"message": "account deleted!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete account: {str(e)}"}), 500
    finally:
        conn.close()