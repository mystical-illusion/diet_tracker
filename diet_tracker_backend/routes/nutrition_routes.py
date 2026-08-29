






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
#         model = genai.GenerativeModel("gemini-3.6-flash")
#         response = model.generate_content(prompt)
#         return jsonify({
#             "recommendation": response.text
#         }), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @nutrition_bp.route("/ai-extract", methods=["POST"])
# def ai_extract():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "no data sent"}), 400

#     text      = data.get("text", "")
#     meal_type = data.get("meal_type", "general")

#     prompt = f"""
#     Extract food items and calories from this text:
#     "{text}"
    
#     Return ONLY a JSON array like this:
#     [
#         {{"food": "banana", "calories": 89}},
#         {{"food": "oatmeal", "calories": 150}}
#     ]
    
#     Rules:
#     - estimate calories if not mentioned
#     - use common portion sizes
#     - return only the JSON array, nothing else!
#     """

#     try:
#         model = genai.GenerativeModel("gemini-pro")
#         response = model.generate_content(prompt)
        
#         # parse JSON from AI response
#         import json
#         import re
        
#         text = response.text.strip()
#         # extract JSON array from response
#         match = re.search(r'\[.*\]', text, re.DOTALL)
#         if match:
#             meals = json.loads(match.group())
#             return jsonify({
#                 "meals": meals,
#                 "meal_type": meal_type
#             }), 200
#         else:
#             return jsonify({"error": "Could not parse meals"}), 400
            
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
















import os
import json
import re
from flask import Blueprint, jsonify, request
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

nutrition_bp = Blueprint("nutrition", __name__)

# Configure API Key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Nutrition database
nutrition_data = {
    "banana":  {"calories": 89,  "protein": 1.1, "carbs": 22.8, "fat": 0.3},
    "rice":    {"calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3},
    "egg":     {"calories": 155, "protein": 13.0,"carbs": 1.1,  "fat": 11.0},
    "apple":   {"calories": 52,  "protein": 0.3, "carbs": 14.0, "fat": 0.2},
    "chicken": {"calories": 239, "protein": 27.0,"carbs": 0.0,  "fat": 14.0},
    "milk":    {"calories": 61,  "protein": 3.2, "carbs": 4.8,  "fat": 3.3}
}

# Fallback calorie estimates if AI is unreachable
FALLBACK_CALORIES = {
    "egg": 78, "eggs": 78, "toast": 80, "bread": 80, "apple": 95,
    "banana": 105, "rice": 200, "roti": 100, "chapati": 100,
    "chicken": 250, "salad": 120, "coffee": 10, "milk": 150,
    "sandwich": 300, "oatmeal": 150, "pizza": 285
}


@nutrition_bp.route("/<food_name>", methods=["GET", "OPTIONS"])
def get_nutrition(food_name):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    food = food_name.lower()
    if food in nutrition_data:
        return jsonify({
            "food": food,
            "nutrition": nutrition_data[food]
        }), 200
    return jsonify({"error": "food not found!"}), 404


@nutrition_bp.route("/list", methods=["GET", "OPTIONS"])
def get_all_nutrition():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify({"foods": nutrition_data}), 200


@nutrition_bp.route("/ai-recommend", methods=["POST", "OPTIONS"])
def ai_recommend():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    daily_goal     = data.get("daily_goal", 2000)
    total_calories = data.get("total_calories", 0)
    meals          = data.get("meals", [])

    meal_summary = "\n".join([
        f"- {meal.get('food', 'Food')}: {meal.get('calories', 0)} calories"
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
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return jsonify({
            "recommendation": response.text
        }), 200
    except Exception as e:
        print(f"AI Recommend Error: {e}")
        return jsonify({
            "recommendation": f"You have {max(0, daily_goal - total_calories)} calories left today. Consider a balanced meal with lean protein and veggies!"
        }), 200


@nutrition_bp.route("/ai-extract", methods=["POST", "OPTIONS"])
def ai_extract():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    text      = data.get("text", "").strip()
    meal_type = data.get("meal_type", "general")

    if not text:
        return jsonify({"error": "no data sent"}), 400

    prompt = f"""
    Extract food items and calories from this text:
    "{text}"
    
    Return ONLY a raw JSON array like this:
    [
        {{"food": "banana", "calories": 89}},
        {{"food": "oatmeal", "calories": 150}}
    ]
    
    Rules:
    - estimate calories if not mentioned
    - use common portion sizes
    - return only the JSON array, nothing else!
    """

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Clean markdown wrappers (```json ... ```)
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text)
            raw_text = raw_text.strip()

        match = re.search(r'\[.*\]', raw_text, re.DOTALL)
        if match:
            meals = json.loads(match.group())
            return jsonify({
                "meals": meals,
                "meal_type": meal_type
            }), 200
        else:
            raise ValueError("Could not parse JSON array from output")

    except Exception as e:
        print(f"AI Extract Error ({e}), applying fallback parser...")
        
        # Rule-based fallback so logging never breaks
        fallback_meals = []
        lower_text = text.lower()
        for food_item, cal in FALLBACK_CALORIES.items():
            if food_item in lower_text:
                fallback_meals.append({"food": food_item.capitalize(), "calories": cal})

        if not fallback_meals:
            fallback_meals = [{"food": text, "calories": 250}]

        return jsonify({
            "meals": fallback_meals,
            "meal_type": meal_type
        }), 200