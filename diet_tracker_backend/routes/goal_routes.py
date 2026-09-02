







import os
import json
from flask import Blueprint, jsonify, request
from database.database import get_db
import google.generativeai as genai

goal_bp = Blueprint("goals", __name__, url_prefix="/goals")
goal_bp = Blueprint("goal", __name__)

@goal_bp.route("/<int:user_id>", methods=["GET", "OPTIONS"])
@goal_bp.route("/<user_id>", methods=["GET", "OPTIONS"])
def get_goal(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            user_id INTEGER PRIMARY KEY,
            daily_goal INTEGER DEFAULT 2000
        )
    """)
    cursor.execute("SELECT daily_goal FROM goals WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    daily_goal = row["daily_goal"] if row else 2000
    return jsonify({"goal": {"user_id": user_id, "daily_goal": daily_goal}}), 200


@goal_bp.route("", methods=["POST", "OPTIONS"])
@goal_bp.route("/", methods=["POST", "OPTIONS"])
def set_goal():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    daily_goal = data.get("daily_goal", 2000)

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            user_id INTEGER PRIMARY KEY,
            daily_goal INTEGER DEFAULT 2000
        )
    """)
    cursor.execute("""
        INSERT INTO goals (user_id, daily_goal) VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET daily_goal = excluded.daily_goal
    """, (user_id, daily_goal))
    conn.commit()
    conn.close()

    return jsonify({"goal": {"user_id": user_id, "daily_goal": daily_goal}}), 200
# --- TDEE Calculator Helper ---
def calculate_tdee(age, gender, height_cm, weight_kg, activity_level):
    # Mifflin-St Jeor Equation
    if str(gender).lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "heavy": 1.725
    }
    multiplier = activity_multipliers.get(str(activity_level).lower(), 1.55)
    return round(bmr * multiplier)


# --- 1. GET & POST/UPDATE Goal by User ID ---
@goal_bp.route("/<int:user_id>", methods=["GET", "POST", "OPTIONS"])
def manage_goal_by_user(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    conn = get_db()

    # GET Goal
    if request.method == "GET":
        goal = conn.execute(
            "SELECT * FROM goals WHERE user_id = ?",
            (user_id,)
        ).fetchone()
        conn.close()

        if goal:
            return jsonify(dict(goal)), 200

        # Return clean defaults if user hasn't set one yet
        return jsonify({
            "user_id": user_id,
            "daily_goal": 2000,
            "goal_type": "maintenance",
            "protein_pct": 30,
            "carbs_pct": 45,
            "fat_pct": 25,
            "protein_g": 150.0,
            "carbs_g": 225.0,
            "fat_g": 55.6,
            "water_goal": 2000,
            "exercise_mins_daily": 30,
            "exercise_mins_weekly": 150,
            "health_conditions": ""
        }), 200

    # POST / UPDATE Goal
    data = request.get_json(silent=True) or {}
    daily_goal = int(data.get("daily_goal", 2000))
    protein_pct = float(data.get("protein_pct", 30))
    carbs_pct = float(data.get("carbs_pct", 45))
    fat_pct = float(data.get("fat_pct", 25))

    # Auto-compute grams from percentage & total calories
    protein_g = float(data.get("protein_g") or round((daily_goal * protein_pct / 100) / 4, 1))
    carbs_g = float(data.get("carbs_g") or round((daily_goal * carbs_pct / 100) / 4, 1))
    fat_g = float(data.get("fat_g") or round((daily_goal * fat_pct / 100) / 9, 1))

    goal_type = data.get("goal_type", "maintenance")
    age = data.get("age")
    gender = data.get("gender")
    height_cm = data.get("height_cm")
    weight_kg = data.get("weight_kg")
    activity_level = data.get("activity_level", "moderate")
    water_goal = int(data.get("water_goal", 2000))
    exercise_daily = int(data.get("exercise_mins_daily", 30))
    exercise_weekly = int(data.get("exercise_mins_weekly", 150))
    conditions = data.get("health_conditions", "")

    conn.execute("""
        INSERT INTO goals (
            user_id, daily_goal, goal_type, age, gender, height_cm, weight_kg,
            activity_level, protein_pct, carbs_pct, fat_pct, protein_g,
            carbs_g, fat_g, water_goal, exercise_mins_daily,
            exercise_mins_weekly, health_conditions
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
            daily_goal=excluded.daily_goal,
            goal_type=excluded.goal_type,
            age=excluded.age,
            gender=excluded.gender,
            height_cm=excluded.height_cm,
            weight_kg=excluded.weight_kg,
            activity_level=excluded.activity_level,
            protein_pct=excluded.protein_pct,
            carbs_pct=excluded.carbs_pct,
            fat_pct=excluded.fat_pct,
            protein_g=excluded.protein_g,
            carbs_g=excluded.carbs_g,
            fat_g=excluded.fat_g,
            water_goal=excluded.water_goal,
            exercise_mins_daily=excluded.exercise_mins_daily,
            exercise_mins_weekly=excluded.exercise_mins_weekly,
            health_conditions=excluded.health_conditions
    """, (
        user_id, daily_goal, goal_type, age, gender, height_cm, weight_kg,
        activity_level, protein_pct, carbs_pct, fat_pct, protein_g,
        carbs_g, fat_g, water_goal, exercise_daily, exercise_weekly, conditions
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Goal updated successfully",
        "macros": {
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g
        }
    }), 200


# --- 2. TDEE & Preset Calculator Endpoint ---
@goal_bp.route("/calculate-tdee", methods=["POST", "OPTIONS"])
def calculate_tdee_endpoint():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    required = ["age", "gender", "height_cm", "weight_kg", "activity_level"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"{field} required"}), 400

    tdee = calculate_tdee(
        float(data["age"]),
        data["gender"],
        float(data["height_cm"]),
        float(data["weight_kg"]),
        data["activity_level"]
    )

    fat_loss = round(tdee * 0.80)
    maintenance = tdee
    muscle_gain = round(tdee * 1.12)

    height_m = float(data["height_cm"]) / 100
    bmi = round(float(data["weight_kg"]) / (height_m ** 2), 1)

    bmi_category = (
        "Underweight" if bmi < 18.5 else
        "Normal"      if bmi < 25   else
        "Overweight"  if bmi < 30   else
        "Obese"
    )

    return jsonify({
        "tdee": tdee,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "presets": {
            "fat_loss": fat_loss,
            "maintenance": maintenance,
            "muscle_gain": muscle_gain
        }
    }), 200


# --- 3. Gemini AI Target Recommender Endpoint ---
@goal_bp.route("/ai-recommend", methods=["POST", "OPTIONS"])
def ai_recommend():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    age = data.get("age", 25)
    gender = data.get("gender", "male")
    height = data.get("height_cm", 175)
    weight = data.get("weight_kg", 70)
    activity = data.get("activity_level", "moderate")
    goal_type = data.get("goal_type", "maintenance")
    conditions = data.get("health_conditions", "None")

    prompt = f"""
    Act as an elite sports clinical nutritionist and dietitian.
    Calculate personal nutrition and exercise targets for:
    - Age: {age}, Gender: {gender}, Height: {height}cm, Weight: {weight}kg
    - Activity Level: {activity}, Primary Goal: {goal_type}
    - Reported Health Conditions: {conditions}

    Provide strictly valid JSON with no markdown and no extra prose outside the JSON:
    {{
      "daily_goal": 2050,
      "goal_type": "{goal_type}",
      "protein_pct": 30,
      "carbs_pct": 45,
      "fat_pct": 25,
      "water_goal": 2800,
      "exercise_mins_daily": 35,
      "exercise_mins_weekly": 180,
      "rationale": "2 concise sentences explaining why these calorie and macro distributions fit their profile."
    }}
    """

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "daily_goal": 1950,
            "goal_type": goal_type,
            "protein_pct": 30,
            "carbs_pct": 45,
            "fat_pct": 25,
            "water_goal": 2500,
            "exercise_mins_daily": 30,
            "exercise_mins_weekly": 150,
            "rationale": "Default baseline targets calculated for your activity level."
        }), 200

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        res = model.generate_content(prompt)
        cleaned = res.text.strip().replace("```json", "").replace("```", "").strip()
        return jsonify(json.loads(cleaned)), 200
    except Exception as e:
        print("Gemini Goal Recommendation error:", str(e))
        return jsonify({
            "daily_goal": 2000,
            "goal_type": goal_type,
            "protein_pct": 30,
            "carbs_pct": 45,
            "fat_pct": 25,
            "water_goal": 2500,
            "exercise_mins_daily": 30,
            "exercise_mins_weekly": 150,
            "rationale": "Standard balanced distribution applied."
        }), 200