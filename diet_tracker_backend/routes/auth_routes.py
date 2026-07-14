from flask import Blueprint, jsonify, request
from services.auth_service import AuthService
import jwt
import os

auth_bp = Blueprint("auth", __name__)
SECRET_KEY = os.getenv("SECRET_KEY", "diet_secret")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "no data sent"}), 400
    if "username" not in data:
        return jsonify({"error": "username required"}), 400
    if "email" not in data:
        return jsonify({"error": "email required"}), 400
    if "password" not in data:
        return jsonify({"error": "password required"}), 400

    try:
        AuthService.create_user(
            data["username"],
            data["email"],
            data["password"]
        )
        return jsonify({"message": "user registered!"}), 201
    except:
        return jsonify({"error": "email already exists"}), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "no data sent"}), 400

    user = AuthService.find_user_by_email(data["email"])

    if not user:
        return jsonify({"error": "user not found"}), 404

    if AuthService.verify_password(data["password"], user["password"]):
        token = AuthService.generate_token(user["id"])
        return jsonify({
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }), 200

    return jsonify({"error": "wrong password"}), 401