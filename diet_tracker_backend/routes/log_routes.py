from flask import Blueprint, jsonify, request
from database.database import get_db
from services.calorie_calc import CalorieCalc

log_bp = Blueprint("log", __name__)

@log_bp.route("/daily", methods=["GET"])
def get_daily_logs():
    user_id = request.args.get("user_id")
    date    = request.args.get("date")

    if not user_id or not date:
        return jsonify({"error": "user_id and date required"}), 400

    conn = get_db()
    
    # 1. Fetch all logged meals for this user and date
    rows = conn.execute(
        "SELECT * FROM meals WHERE user_id = ? AND date = ?",
        (user_id, date)
    ).fetchall()
    meals = [dict(row) for row in rows]
    total = CalorieCalc.calculate_total(meals)

    # 2. Fetch the logged water intake for this date
    water_row = conn.execute(
        "SELECT water FROM daily_logs WHERE user_id = ? AND date = ?",
        (user_id, date)
    ).fetchone()
    
    water_amount = water_row["water"] if water_row else 0
    conn.close()

    # 3. 🎯 Balanced with your Zustand store layout! Return objects grouped inside 'totals'
    return jsonify({
        "date": date,
        "meals": meals,
        "totals": {
            "calories": total,
            "water": water_amount
        }
    }), 200


@log_bp.route("/water", methods=["POST"])
def update_water():
    data = request.get_json(silent=True)
    if not data or "date" not in data or "water" not in data or "user_id" not in data:
        return jsonify({"error": "Missing required fields (date, water, user_id)"}), 400
        
    user_id = data["user_id"]
    date_str = data["date"]
    water_val = data["water"]
    
    conn = get_db()
    try:
        # Update or insert water metrics cleanly
        conn.execute(
            "INSERT INTO daily_logs (user_id, date, water) VALUES (?, ?, ?) "
            "ON CONFLICT(user_id, date) DO UPDATE SET water = ?",
            (user_id, date_str, water_val, water_val)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500
        
    conn.close()
    return jsonify({"message": "Hydration tracked successfully", "water": water_val}), 200