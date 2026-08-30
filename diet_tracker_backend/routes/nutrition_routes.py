# from flask import Blueprint, jsonify, request
# from database.database import get_db
# import google.generativeai as genai
# import os
# import json
# import re

# nutrition_bp = Blueprint("nutrition", __name__)
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# nutrition_data = {
#     "banana":  {"calories": 89,  "protein": 1.1, "carbs": 22.8, "fat": 0.3},
#     "rice":    {"calories": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3},
#     "egg":     {"calories": 155, "protein": 13.0,"carbs": 1.1,  "fat": 11.0},
#     "apple":   {"calories": 52,  "protein": 0.3, "carbs": 14.0, "fat": 0.2},
#     "chicken": {"calories": 239, "protein": 27.0,"carbs": 0.0,  "fat": 14.0},
#     "milk":    {"calories": 61,  "protein": 3.2, "carbs": 4.8,  "fat": 3.3}
# }

# # ✅ list route FIRST
# @nutrition_bp.route("/list", methods=["GET"])
# def get_all_nutrition():
#     return jsonify({"foods": nutrition_data}), 200

# # ✅ AI routes BEFORE /<food_name>
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
#         model = genai.GenerativeModel("gemini-pro")
#         response = model.generate_content(prompt)
#         return jsonify({"recommendation": response.text}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @nutrition_bp.route("/ai-chat", methods=["POST"])
# def ai_chat():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "no data sent"}), 400

#     user_id  = data.get("user_id")
#     question = data.get("question")

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
#     Give personalized advice. Be friendly!
#     """

#     try:
#         model = genai.GenerativeModel("gemini-pro")
#         response = model.generate_content(prompt)
#         return jsonify({"answer": response.text}), 200
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
#     [{{"food": "banana", "calories": 89}}]
#     Rules:
#     - estimate calories if not mentioned
#     - use common portion sizes
#     - return ONLY the JSON array, nothing else!
#     """

#     try:
#         model = genai.GenerativeModel("gemini-pro")
#         response = model.generate_content(prompt)
#         text_response = response.text.strip()
#         match = re.search(r'\[.*\]', text_response, re.DOTALL)
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


# # ✅ food_name route LAST
# @nutrition_bp.route("/<food_name>", methods=["GET"])
# def get_nutrition(food_name):
#     food = food_name.lower()
#     if food in nutrition_data:
#         return jsonify({
#             "food": food,
#             "nutrition": nutrition_data[food]
#         }), 200
#     return jsonify({"error": "food not found!"}), 404










import os
import json
import re
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
from database.database import get_db

load_dotenv()

# Configure Gemini API Key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("⚠️ WARNING: GEMINI_API_KEY is not configured in .env!")

nutrition_bp = Blueprint("nutrition", __name__)

# Helper to load the current active model
def get_gemini_model(system_instruction=None):
    model_candidates = ["gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"]
    for model_name in model_candidates:
        try:
            if system_instruction:
                return genai.GenerativeModel(model_name, system_instruction=system_instruction)
            return genai.GenerativeModel(model_name)
        except Exception:
            continue
    # Fallback to recommended default
    return genai.GenerativeModel("gemini-3.6-flash")


# -------------------------------------------------------------
# 1. AI Smart Calorie Extractor (/nutrition/ai-extract)
# -------------------------------------------------------------
@nutrition_bp.route("/ai-extract", methods=["POST", "OPTIONS"])
def ai_extract():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    meal_type_pref = data.get("meal_type", "auto").lower()

    if not text:
        return jsonify({"meals": [], "meal_type": "snack"}), 400

    prompt = f"""
    You are an expert nutritionist specialized in Indian and global cuisine.
    The user ate: "{text}".

    Instructions:
    1. Break down the meal into distinct items or compute the accurate combined total (e.g., Aloo Paratha: ~300-350 kcal; Rice + Rajma + Bundi Raita + Aloo Chips + Salad: ~650-750 kcal).
    2. Provide realistic calorie estimates based on standard portion sizes and nutritional databases.
    3. Determine the meal category: "breakfast", "lunch", "dinner", or "snack". (If user preferred "{meal_type_pref}" and it is not "auto", use "{meal_type_pref}").

    Return ONLY a raw JSON object with NO markdown code fences or backticks:
    {{
      "meals": [
        {{"food": "Item Name", "calories": 350}}
      ],
      "meal_type": "lunch"
    }}
    """

    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)

        clean_json = re.sub(r"```(?:json)?\s*|\s*```", "", response.text.strip()).strip()
        parsed = json.loads(clean_json)

        meals_list = []
        for item in parsed.get("meals", []):
            meals_list.append({
                "food": str(item.get("food", text)),
                "calories": int(item.get("calories", 300))
            })

        final_meal_type = parsed.get("meal_type", "snack").lower()
        if meal_type_pref != "auto":
            final_meal_type = meal_type_pref

        return jsonify({
            "meals": meals_list,
            "meal_type": final_meal_type
        }), 200

    except Exception as e:
        print(f"❌ Error in /ai-extract: {e}")
        return jsonify({
            "meals": [{"food": text, "calories": 350}],
            "meal_type": "snack" if meal_type_pref == "auto" else meal_type_pref
        }), 200


# -------------------------------------------------------------
# 2. Conversational AI Nutrition Coach (/nutrition/ai-chat)
# -------------------------------------------------------------
@nutrition_bp.route("/ai-chat", methods=["POST", "OPTIONS"])
def ai_chat():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()
    history = data.get("history", [])
    user_id = data.get("user_id")

    if not question:
        return jsonify({"answer": "How can I assist your nutrition journey today?"}), 200

    user_context = ""
    if user_id:
        try:
            conn = get_db()
            meals = conn.execute(
                "SELECT food, calories FROM meals WHERE user_id = ? AND date = CURRENT_DATE",
                (user_id,)
            ).fetchall()
            goal_row = conn.execute(
                "SELECT daily_goal FROM goals WHERE user_id = ?",
                (user_id,)
            ).fetchone()
            conn.close()

            today_cals = sum(m["calories"] for m in meals)
            goal_cals = goal_row["daily_goal"] if goal_row else 2000
            meal_list = ", ".join([f"{m['food']} ({m['calories']} kcal)" for m in meals]) or "None logged yet"

            user_context = f"""
            User's Current Daily Stats:
            - Daily Calorie Target: {goal_cals} kcal
            - Consumed Today: {today_cals} kcal
            - Meals Logged Today: {meal_list}
            """
        except Exception as db_err:
            print(f"Context retrieval error: {db_err}")

    system_instruction = f"""
    You are an empathetic, certified AI dietitian and nutrition coach.
    {user_context}

    Guidelines:
    1. Reply directly to the user's latest query in a friendly, conversational tone (2-3 sentences).
    2. Reference their actual logged meals and calorie target when evaluating if their intake is sufficient or balanced.
    3. Provide actionable nutrition tips (macros, hydration, meal adjustments).
    """

    try:
        model = get_gemini_model(system_instruction=system_instruction)

        gemini_history = []
        for msg in history:
            role = "user" if msg.get("sender") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.get("text", "")]})

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(question)

        return jsonify({"answer": response.text.strip()}), 200

    except Exception as e:
        print(f"❌ Gemini Chat Error: {e}")
        return jsonify({"answer": f"AI service error: {str(e)}"}), 200