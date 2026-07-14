from flask import Blueprint, jsonify

nutrition_bp = Blueprint("nutrition", __name__)

# simple nutrition database
nutrition_data = {
    "banana":  {"calories": 89,  "protein": 1.1, "carbs": 22.8, "fat": 0.3},
    "rice":    {"calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3},
    "egg":     {"calories": 155, "protein": 13.0,"carbs": 1.1,  "fat": 11.0},
    "apple":   {"calories": 52,  "protein": 0.3, "carbs": 14.0, "fat": 0.2},
    "chicken": {"calories": 239, "protein": 27.0,"carbs": 0.0,  "fat": 14.0},
    "milk":    {"calories": 61,  "protein": 3.2, "carbs": 4.8,  "fat": 3.3}
}

# GET /nutrition/<food_name>
@nutrition_bp.route("/<food_name>", methods=["GET"])
def get_nutrition(food_name):
    food = food_name.lower()

    if food in nutrition_data:
        return jsonify({
            "food": food,
            "nutrition": nutrition_data[food]
        }), 200

    return jsonify({"error": "food not found!"}), 404


# GET /nutrition/list
@nutrition_bp.route("/list", methods=["GET"])
def get_all_nutrition():
    return jsonify({
        "foods": nutrition_data
    }), 200