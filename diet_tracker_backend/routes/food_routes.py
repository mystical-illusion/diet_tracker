from flask import Blueprint, jsonify, request
from services.food_service import FoodService

food_bp = Blueprint("food", __name__)

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

    FoodService.add_meal(
        data["user_id"], 
        data["food"], 
        int(data["calories"])
    )

    return jsonify({"message": "meal added!"}), 201

@food_bp.route("/list", methods=["GET"])
def get_meals():
    # get user_id from query params
    user_id = request.args.get("user_id")
    
    conn = get_db()
    
    if user_id:
        # only get THIS user's meals
        rows = conn.execute(
            "SELECT * FROM meals WHERE user_id = ?",
            (user_id,)
        ).fetchall()
    else:
        # get all meals (fallback)
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