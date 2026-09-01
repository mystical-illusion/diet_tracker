from datetime import datetime
from flask import Blueprint, jsonify, request
from database.database import get_db

log_bp = Blueprint("logs", __name__, url_prefix="/logs")

@log_bp.route("/daily", methods=["GET", "OPTIONS"])
def get_daily_logs():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    raw_date = request.args.get("date")

    if not user_id or not raw_date:
        return jsonify({"error": "user_id and date required"}), 400

    # Normalize date to YYYY-MM-DD regardless of frontend format
    try:
        if "-" in raw_date and len(raw_date.split("-")[0]) == 4:
            date_str = raw_date  # Already YYYY-MM-DD
        else:
            # Parse DD-MM-YYYY or MM-DD-YYYY to standard YYYY-MM-DD
            parts = raw_date.split("-")
            if len(parts[2]) == 4:
                date_str = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            else:
                date_str = raw_date
    except Exception:
        date_str = raw_date

    try:
        conn = get_db()
        meals = conn.execute("""
            SELECT id, food, calories, 
                   COALESCE(protein, 0) as protein, 
                   COALESCE(carbs, 0) as carbs, 
                   COALESCE(fat, 0) as fat, 
                   COALESCE(meal_type, 'snack') as meal_type,
                   date, time
            FROM meals
            WHERE user_id = ? AND (date = ? OR date = ?)
            ORDER BY id DESC
        """, (user_id, date_str, raw_date)).fetchall()

        goal = conn.execute(
            "SELECT daily_goal FROM goals WHERE user_id = ?",
            (user_id,)
        ).fetchone()
        conn.close()

        meals_list = [dict(m) for m in meals]
        total_calories = sum(int(m["calories"] or 0) for m in meals_list)
        daily_goal = int(goal["daily_goal"]) if goal and goal["daily_goal"] else 1800

        return jsonify({
            "date": date_str,
            "meals": meals_list,
            "total_calories": total_calories,
            "goal_target": daily_goal,
            "remaining": max(0, daily_goal - total_calories)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500