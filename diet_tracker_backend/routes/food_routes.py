from flask import Blueprint, jsonify, request
from services.food_service import FoodService
from database.database import get_db

food_bp = Blueprint("food", __name__)

@food_bp.route("/list", methods=["GET"])
def get_meals():
    user_id = request.args.get("user_id")
    date    = request.args.get("date")  # ← add date filter!

    conn = get_db()

    if user_id and date:
        # filter by user AND date
        rows = conn.execute(
            "SELECT * FROM meals WHERE user_id = ? AND date = ?",
            (user_id, date)
        ).fetchall()
    elif user_id:
        # filter by user only
        rows = conn.execute(
            "SELECT * FROM meals WHERE user_id = ?",
            (user_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM meals"
        ).fetchall()

    conn.close()
    meals_list = [dict(row) for row in rows]
    return jsonify({"meals": meals_list}), 200
@food_bp.route("/<int:meal_id>", methods=["DELETE"])
def delete_meal(meal_id):
    meal = FoodService.get_meal_by_id(meal_id)

    if meal:
        FoodService.delete_meal(meal_id)
        return jsonify({"message": "meal deleted!"}), 200

    return jsonify({"message": "meal not found!"}), 404

@food_bp.route("/<int:meal_id>", methods=["PUT"])
def update_meal(meal_id):
    data = request.get_json(silent=True)
    meal = FoodService.get_meal_by_id(meal_id)

    if meal:
        FoodService.update_meal(
            meal_id, 
            data["food"], 
            data["calories"]
        )
        return jsonify({"message": "meal updated!"}), 200

    return jsonify({"message": "meal not found!"}), 404

@food_bp.route("/add", methods=["POST"])
def add_food():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "no data sent"}), 400
    if "food" not in data:
        return jsonify({"error": "food is required"}), 400
    if "calories" not in data:
        return jsonify({"error": "calories is required"}), 400
    if "user_id" not in data:
        return jsonify({"error": "user_id is required"}), 400

    # get meal_type (optional)
    meal_type = data.get("meal_type", "general")

    conn = get_db()
    conn.execute(
        "INSERT INTO meals (user_id, food, calories, meal_type) VALUES (?, ?, ?, ?)",
        (data["user_id"], data["food"], 
         int(data["calories"]), meal_type)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "meal added!"}), 201