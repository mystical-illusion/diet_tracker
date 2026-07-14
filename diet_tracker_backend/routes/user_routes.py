from flask import Blueprint, jsonify, request
from database.database import get_db

user_bp = Blueprint("user", __name__)

@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    if user:
        # only return id and username, NOT password!
        return jsonify({
            "user": {
                "id": user["id"],
                "username": user["username"]
            }
        }), 200
    
    return jsonify({"message": "user not found!"}), 404
@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json(silent=True)
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if user:
        conn.execute(
            "UPDATE users SET username = ? WHERE id = ?",
            (data["username"], user_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "user updated!"}), 200

    conn.close()
    return jsonify({"message": "user not found!"}), 404