from flask import Blueprint, jsonify, request
from database.database import get_db

user_bp = Blueprint("user", __name__)

def compute_bmi(weight_kg, height_cm):
    try:
        height_m = (float(height_cm) if height_cm else 165.0) / 100.0
        weight = float(weight_kg) if weight_kg else 65.0
        bmi = round(weight / (height_m ** 2), 1)
    except Exception:
        bmi = 23.9

    if bmi < 18.5:
        category = "Underweight"
        color = "#38bdf8"
    elif 18.5 <= bmi < 25.0:
        category = "Normal weight"
        color = "#4ade80"
    elif 25.0 <= bmi < 30.0:
        category = "Overweight"
        color = "#facc15"
    else:
        category = "Obesity"
        color = "#f87171"

    return bmi, category, color


# GET /user/<int:user_id>
@user_bp.route("/<int:user_id>", methods=["GET", "OPTIONS"])
def get_user_profile(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        conn = get_db()
        user = conn.execute(
            "SELECT id, username, age, gender, height_cm, weight_kg FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        conn.close()

        if not user:
            return jsonify({
                "user": {
                    "id": user_id,
                    "username": f"User {user_id}",
                    "height_cm": 165.0,
                    "weight_kg": 65.0,
                    "age": 25,
                    "gender": "female"
                },
                "bmi": 23.9,
                "bmi_category": "Normal weight",
                "bmi_color": "#4ade80"
            }), 200

        user_dict = dict(user)
        bmi, category, color = compute_bmi(user_dict.get("weight_kg"), user_dict.get("height_cm"))

        return jsonify({
            "user": user_dict,
            "bmi": bmi,
            "bmi_category": category,
            "bmi_color": color
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /user/<int:user_id>
@user_bp.route("/<int:user_id>", methods=["PUT", "OPTIONS"])
def update_user_profile(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json(silent=True) or {}
        conn = get_db()

        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"message": "User not found!"}), 404

        user_dict = dict(user)
        username = data.get("username", user_dict.get("username"))
        height_cm = float(data.get("height_cm", user_dict.get("height_cm") or 165.0))
        weight_kg = float(data.get("weight_kg", user_dict.get("weight_kg") or 65.0))
        age = int(data.get("age", user_dict.get("age") or 25))
        gender = str(data.get("gender", user_dict.get("gender") or "female")).lower()

        conn.execute("""
            UPDATE users 
            SET username = ?, height_cm = ?, weight_kg = ?, age = ?, gender = ?
            WHERE id = ?
        """, (username, height_cm, weight_kg, age, gender, user_id))
        conn.commit()
        conn.close()

        bmi, category, color = compute_bmi(weight_kg, height_cm)

        return jsonify({
            "message": "User profile updated successfully!",
            "user": {
                "id": user_id,
                "username": username,
                "height_cm": height_cm,
                "weight_kg": weight_kg,
                "age": age,
                "gender": gender
            },
            "bmi": bmi,
            "bmi_category": category,
            "bmi_color": color
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500