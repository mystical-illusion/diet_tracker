# from flask import Blueprint, jsonify, request
# from database.database import get_db
# import google.generativeai as genai
# import os

# nutrition_bp = Blueprint("nutrition", __name__)

# # ← change this line!
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# # nutrition database
# nutrition_data = {
#     "banana":  {"calories": 89,  "protein": 1.1, "carbs": 22.8, "fat": 0.3},
#     "rice":    {"calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3},
#     "egg":     {"calories": 155, "protein": 13.0,"carbs": 1.1,  "fat": 11.0},
#     "apple":   {"calories": 52,  "protein": 0.3, "carbs": 14.0, "fat": 0.2},
#     "chicken": {"calories": 239, "protein": 27.0,"carbs": 0.0,  "fat": 14.0},
#     "milk":    {"calories": 61,  "protein": 3.2, "carbs": 4.8,  "fat": 3.3}
# }

# @nutrition_bp.route("/<food_name>", methods=["GET"])
# def get_nutrition(food_name):
#     food = food_name.lower()
#     if food in nutrition_data:
#         return jsonify({
#             "food": food,
#             "nutrition": nutrition_data[food]
#         }), 200
#     return jsonify({"error": "food not found!"}), 404

# @nutrition_bp.route("/list", methods=["GET"])
# def get_all_nutrition():
#     return jsonify({"foods": nutrition_data}), 200

# @nutrition_bp.route("/ai-recommend", methods=["POST"])
# def ai_recommend():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "no data sent"}), 400

#     daily_goal     = data.get("daily_goal", 2000)
#     total_calories = data.get("total_calories", 0)
#     meals          = data.get("meals", [])

#     meal_summary = "\n".join([
#         f"- {meal['food']}: {meal['calories']} calories"
#         for meal in meals
#     ])

#     prompt = f"""
#     You are a friendly nutrition expert.
    
#     Daily goal: {daily_goal} calories
#     Consumed: {total_calories} calories
#     Remaining: {daily_goal - total_calories} calories
    
#     Today's meals:
#     {meal_summary if meal_summary else "No meals logged yet"}
    
#     Provide:
#     1. Brief nutrition analysis
#     2. 2-3 meal suggestions for remaining calories
#     3. One health tip
    
#     Be friendly and concise!
#     """

#     try:
#         model = genai.GenerativeModel("gemini-1.5-flash")
#         response = model.generate_content(prompt)
#         return jsonify({
#             "recommendation": response.text
#         }), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @nutrition_bp.route("/ai-chat", methods=["POST"])
# def ai_chat():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "no data sent"}), 400

#     user_id  = data.get("user_id")
#     question = data.get("question")

#     # RAG - get user's data
#     conn = get_db()
#     meals = conn.execute("""
#         SELECT food, calories, date
#         FROM meals WHERE user_id = ?
#         ORDER BY date DESC LIMIT 50
#     """, (user_id,)).fetchall()

#     goal = conn.execute(
#         "SELECT daily_goal FROM goals WHERE user_id = ?",
#         (user_id,)
#     ).fetchone()
#     conn.close()

#     meal_history = "\n".join([
#         f"- {m['date']}: {m['food']} ({m['calories']} cal)"
#         for m in meals
#     ])

#     prompt = f"""
#     You are a personal nutrition coach.
    
#     User's daily goal: {goal['daily_goal'] if goal else 2000} calories
    
#     Meal history:
#     {meal_history if meal_history else "No meals logged yet"}
    
#     Question: {question}
    
#     Give personalized advice based on their data.
#     Be friendly and encouraging!
#     """

#     try:
#       # try this instead
#         model = genai.GenerativeModel("gemini-pro")
#         response = model.generate_content(prompt)

#         return jsonify({"answer": response.text}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500













from flask import Blueprint, jsonify, request
from database.database import get_db
import google.generativeai as genai
import os

nutrition_bp = Blueprint("nutrition", __name__)

# ← change this line!
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# nutrition database
nutrition_data = {
    "banana":  {"calories": 89,  "protein": 1.1, "carbs": 22.8, "fat": 0.3},
    "rice":    {"calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3},
    "egg":     {"calories": 155, "protein": 13.0,"carbs": 1.1,  "fat": 11.0},
    "apple":   {"calories": 52,  "protein": 0.3, "carbs": 14.0, "fat": 0.2},
    "chicken": {"calories": 239, "protein": 27.0,"carbs": 0.0,  "fat": 14.0},
    "milk":    {"calories": 61,  "protein": 3.2, "carbs": 4.8,  "fat": 3.3}
}

@nutrition_bp.route("/<food_name>", methods=["GET"])
def get_nutrition(food_name):
    food = food_name.lower()
    if food in nutrition_data:
        return jsonify({
            "food": food,
            "nutrition": nutrition_data[food]
        }), 200
    return jsonify({"error": "food not found!"}), 404

@nutrition_bp.route("/list", methods=["GET"])
def get_all_nutrition():
    return jsonify({"foods": nutrition_data}), 200

@nutrition_bp.route("/ai-recommend", methods=["POST"])
def ai_recommend():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "no data sent"}), 400

    daily_goal     = data.get("daily_goal", 2000)
    total_calories = data.get("total_calories", 0)
    meals          = data.get("meals", [])

    meal_summary = "\n".join([
        f"- {meal['food']}: {meal['calories']} calories"
        for meal in meals
    ])

    prompt = f"""
    You are a friendly nutrition expert.
    
    Daily goal: {daily_goal} calories
    Consumed: {total_calories} calories
    Remaining: {daily_goal - total_calories} calories
    
    Today's meals:
    {meal_summary if meal_summary else "No meals logged yet"}
    
    Provide:
    1. Brief nutrition analysis
    2. 2-3 meal suggestions for remaining calories
    3. One health tip
    
    Be friendly and concise!
    """

    try:
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt)
        return jsonify({
            "recommendation": response.text
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nutrition_bp.route("/ai-chat", methods=["POST"])
def ai_chat():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "no data sent"}), 400

    user_id  = data.get("user_id")
    question = data.get("question")

    # RAG - get user's data
    conn = get_db()
    meals = conn.execute("""
        SELECT food, calories, date
        FROM meals WHERE user_id = ?
        ORDER BY date DESC LIMIT 50
    """, (user_id,)).fetchall()

    goal = conn.execute(
        "SELECT daily_goal FROM goals WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    meal_history = "\n".join([
        f"- {m['date']}: {m['food']} ({m['calories']} cal)"
        for m in meals
    ])

    prompt = f"""
    You are a personal nutrition coach.
    
    User's daily goal: {goal['daily_goal'] if goal else 2000} calories
    
    Meal history:
    {meal_history if meal_history else "No meals logged yet"}
    
    Question: {question}
    
    Give personalized advice based on their data.
    Be friendly and encouraging!
    """

    try:
        # try this instead
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt)

        return jsonify({"answer": response.text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500