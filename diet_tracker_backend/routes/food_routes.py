import os
from datetime import datetime
from flask import Blueprint, jsonify, request
from database.database import get_db

food_bp = Blueprint("food", __name__, url_prefix="/food")


def normalize_date(date_str):
    """Normalize date strings (YYYY-MM-DD or DD-MM-YYYY) to standard YYYY-MM-DD."""
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d")
    
    parts = date_str.split("-")
    # If provided in DD-MM-YYYY format, convert to YYYY-MM-DD
    if len(parts) == 3 and len(parts[0]) == 2 and len(parts[2]) == 4:
        return f"{parts[2]}-{parts[1]}-{parts[0]}"
    return date_str


# 1. Fetch Food List for a Specific Date (Supports /food/list and /food/daily)
@food_bp.route("/list", methods=["GET", "OPTIONS"])
@food_bp.route("/daily", methods=["GET", "OPTIONS"])
def get_food_logs():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    raw_date = request.args.get("date")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    target_date = normalize_date(raw_date)

    try:
        conn = get_db()

        # Query meals matching normalized date or raw date string format
        meals = conn.execute("""
            SELECT 
                id, 
                food, 
                calories, 
                COALESCE(protein, 0) as protein, 
                COALESCE(carbs, 0) as carbs, 
                COALESCE(fat, 0) as fat, 
                COALESCE(meal_type, 'snack') as meal_type,
                COALESCE(time, '') as time,
                date
            FROM meals
            WHERE user_id = ? AND (date = ? OR date = ?)
            ORDER BY id DESC
        """, (user_id, target_date, raw_date)).fetchall()

        # Fetch daily target from goals table
        goal_row = conn.execute("""
            SELECT daily_goal, protein_g, carbs_g, fat_g, water_ml 
            FROM goals 
            WHERE user_id = ?
        """, (user_id,)).fetchone()

        # Fetch hydration log for this date
        water_row = conn.execute("""
            SELECT water 
            FROM daily_logs 
            WHERE user_id = ? AND (date = ? OR date = ?)
        """, (user_id, target_date, raw_date)).fetchone()

        conn.close()

        meals_list = [dict(m) for m in meals]

        total_calories = sum(int(m["calories"] or 0) for m in meals_list)
        total_protein = sum(float(m["protein"] or 0) for m in meals_list)
        total_carbs = sum(float(m["carbs"] or 0) for m in meals_list)
        total_fat = sum(float(m["fat"] or 0) for m in meals_list)

        daily_goal = int(goal_row["daily_goal"]) if goal_row and goal_row["daily_goal"] else 1800
        water_val = int(water_row["water"] or 0) if water_row else 0

        return jsonify({
            "date": target_date,
            "meals": meals_list,
            "total_items": len(meals_list),
            "total_calories": total_calories,
            "total_protein": round(total_protein, 1),
            "total_carbs": round(total_carbs, 1),
            "total_fat": round(total_fat, 1),
            "goal_target": daily_goal,
            "remaining": max(0, daily_goal - total_calories),
            "water": water_val
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 2. Add a Food/Meal Log Entry
@food_bp.route("/add", methods=["POST", "OPTIONS"])
@food_bp.route("/log", methods=["POST", "OPTIONS"])
def add_food():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    user_id = data.get("user_id")
    food = data.get("food")
    calories = data.get("calories")
    protein = data.get("protein", 0)
    carbs = data.get("carbs", 0)
    fat = data.get("fat", 0)
    meal_type = data.get("meal_type", "snack").lower()
    date_str = normalize_date(data.get("date"))
    time_str = data.get("time", datetime.now().strftime("%H:%M"))

    if not user_id or not food or calories is None:
        return jsonify({"error": "user_id, food name, and calories are required"}), 400

    try:
        conn = get_db()
        cursor = conn.execute("""
            INSERT INTO meals (user_id, food, calories, protein, carbs, fat, meal_type, date, time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, food, int(calories), float(protein), float(carbs), float(fat), meal_type, date_str, time_str))
        conn.commit()
        inserted_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "message": "Meal logged successfully",
            "meal_id": inserted_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 3. Delete Meal Entry by ID
@food_bp.route("/<int:meal_id>", methods=["DELETE", "OPTIONS"])
@food_bp.route("/delete/<int:meal_id>", methods=["DELETE", "OPTIONS"])
def delete_food(meal_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        conn = get_db()
        conn.execute("DELETE FROM meals WHERE id = ? AND user_id = ?", (meal_id, user_id))
        conn.commit()
        conn.close()

        return jsonify({"message": "Meal deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 4. Update / Edit Existing Meal Entry
@food_bp.route("/<int:meal_id>", methods=["PUT", "OPTIONS"])
@food_bp.route("/update/<int:meal_id>", methods=["PUT", "OPTIONS"])
def update_food(meal_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    user_id = data.get("user_id")
    food = data.get("food")
    calories = data.get("calories")
    protein = data.get("protein", 0)
    carbs = data.get("carbs", 0)
    fat = data.get("fat", 0)
    meal_type = data.get("meal_type", "snack").lower()

    if not user_id or not food or calories is None:
        return jsonify({"error": "user_id, food name, and calories are required"}), 400

    try:
        conn = get_db()
        conn.execute("""
            UPDATE meals 
            SET food = ?, calories = ?, protein = ?, carbs = ?, fat = ?, meal_type = ?
            WHERE id = ? AND user_id = ?
        """, (food, int(calories), float(protein), float(carbs), float(fat), meal_type, meal_id, user_id))
        conn.commit()
        conn.close()

        return jsonify({"message": "Meal updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500