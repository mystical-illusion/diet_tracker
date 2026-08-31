from flask import Blueprint, jsonify, request
from database.database import get_db

analytics_bp = Blueprint("analytics", __name__)


# GET /analytics/daily?user_id=1&days=7
@analytics_bp.route("/daily", methods=["GET"])
def get_daily_data():
    user_id = request.args.get("user_id")
    days    = request.args.get("days", 7, type=int)

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()
    rows = conn.execute("""
        SELECT 
            date,
            SUM(calories) as total_calories,
            COUNT(*) as meal_count
        FROM meals
        WHERE user_id = ?
        GROUP BY date
        ORDER BY date DESC
        LIMIT ?
    """, (user_id, days)).fetchall()
    conn.close()

    data = [dict(row) for row in rows]
    data.reverse()  # oldest first for charts

    return jsonify({
        "daily": data,
        "days": days
    }), 200


# GET /analytics/weekly?user_id=1
@analytics_bp.route("/weekly", methods=["GET"])
def get_weekly_summary():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()
    rows = conn.execute("""
        SELECT 
            date,
            SUM(calories) as total_calories,
            COUNT(*) as meal_count,
            MAX(calories) as highest_meal,
            MIN(calories) as lowest_meal,
            AVG(calories) as avg_meal_calories
        FROM meals
        WHERE user_id = ?
        GROUP BY date
        ORDER BY date DESC
        LIMIT 7
    """, (user_id,)).fetchall()
    conn.close()

    data = [dict(row) for row in rows]
    data.reverse()

    # calculate averages
    if data:
        avg_daily = sum(d["total_calories"] for d in data) / len(data)
        total_week = sum(d["total_calories"] for d in data)
    else:
        avg_daily = 0
        total_week = 0

    return jsonify({
        "weekly": data,
        "summary": {
            "avg_daily_calories": round(avg_daily),
            "total_week_calories": total_week,
            "days_tracked": len(data)
        }
    }), 200


# GET /analytics/stats?user_id=1
@analytics_bp.route("/stats", methods=["GET"])
def get_user_stats():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()

    # total meals logged
    total_meals = conn.execute(
        "SELECT COUNT(*) as count FROM meals WHERE user_id = ?",
        (user_id,)
    ).fetchone()["count"]

    # total days tracked
    total_days = conn.execute(
        "SELECT COUNT(DISTINCT date) as count FROM meals WHERE user_id = ?",
        (user_id,)
    ).fetchone()["count"]

    # average daily calories
    avg_calories = conn.execute("""
        SELECT AVG(daily_total) as avg
        FROM (
            SELECT SUM(calories) as daily_total
            FROM meals
            WHERE user_id = ?
            GROUP BY date
        )
    """, (user_id,)).fetchone()["avg"]

    # most eaten food
    top_food = conn.execute("""
        SELECT food, COUNT(*) as count
        FROM meals
        WHERE user_id = ?
        GROUP BY food
        ORDER BY count DESC
        LIMIT 1
    """, (user_id,)).fetchone()

    # today's calories
    today_calories = conn.execute("""
        SELECT SUM(calories) as total
        FROM meals
        WHERE user_id = ? 
        AND date = DATE('now')
    """, (user_id,)).fetchone()["total"]

    conn.close()

    return jsonify({
        "total_meals": total_meals,
        "total_days": total_days,
        "avg_daily_calories": round(avg_calories or 0),
        "top_food": dict(top_food) if top_food else None,
        "today_calories": today_calories or 0
    }), 200


# GET /analytics/meals-by-date?user_id=1&date=2026-06-20
@analytics_bp.route("/meals-by-date", methods=["GET"])
def get_meals_by_date():
    user_id = request.args.get("user_id")
    date    = request.args.get("date")

    if not user_id or not date:
        return jsonify({"error": "user_id and date required"}), 400

    conn = get_db()
    meals = conn.execute("""
        SELECT id, food, calories, date
        FROM meals
        WHERE user_id = ? AND date = ?
        ORDER BY id ASC
    """, (user_id, date)).fetchall()
    conn.close()

    meals_list = [dict(m) for m in meals]
    total = sum(m["calories"] for m in meals_list)

    return jsonify({
        "date": date,
        "meals": meals_list,
        "total_calories": total,
        "meal_count": len(meals_list)
    }), 200


# GET /analytics/top-foods?user_id=1
@analytics_bp.route("/top-foods", methods=["GET"])
def get_top_foods():
    user_id = request.args.get("user_id")
    limit   = request.args.get("limit", 5, type=int)

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()
    foods = conn.execute("""
        SELECT 
            food,
            COUNT(*) as times_eaten,
            AVG(calories) as avg_calories,
            SUM(calories) as total_calories
        FROM meals
        WHERE user_id = ?
        GROUP BY food
        ORDER BY times_eaten DESC
        LIMIT ?
    """, (user_id, limit)).fetchall()
    conn.close()

    return jsonify({
        "top_foods": [dict(f) for f in foods]
    }), 200

@analytics_bp.route("/weekly-organized", methods=["GET"])
def get_weekly_organized():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()
    rows = conn.execute("""
        SELECT id, food, calories, meal_type, date
        FROM meals
        WHERE user_id = ?
        ORDER BY date DESC, id ASC
        LIMIT 100
    """, (user_id,)).fetchall()
    conn.close()

    meals = [dict(row) for row in rows]

    # organize by date then meal_type
    organized = {}
    for meal in meals:
        date = meal["date"]
        meal_type = meal["meal_type"] or "general"

        if date not in organized:
            organized[date] = {
                "date": date,
                "breakfast": [],
                "lunch": [],
                "dinner": [],
                "snack": [],
                "general": [],
                "total_calories": 0
            }

        organized[date][meal_type].append(meal)
        organized[date]["total_calories"] += meal["calories"]

    # convert to sorted list
    result = sorted(
        organized.values(),
        key=lambda x: x["date"],
        reverse=True
    )[:7]  # last 7 days

    return jsonify({
        "weekly": result
    }), 200
@analytics_bp.route("/weekly-comparison", methods=["GET"])
def weekly_comparison():
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()
    
    # get goal
    goal = conn.execute(
        "SELECT daily_goal FROM goals WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    daily_goal = goal["daily_goal"] if goal else 2000

    # this week data (last 7 days)
    this_week = conn.execute("""
        SELECT 
            date,
            SUM(calories) as total_calories,
            COUNT(*) as meal_count
        FROM meals
        WHERE user_id = ?
        AND date >= DATE('now', '-7 days')
        GROUP BY date
        ORDER BY date ASC
    """, (user_id,)).fetchall()

    # last week data (7-14 days ago)
    last_week = conn.execute("""
        SELECT 
            date,
            SUM(calories) as total_calories,
            COUNT(*) as meal_count
        FROM meals
        WHERE user_id = ?
        AND date >= DATE('now', '-14 days')
        AND date < DATE('now', '-7 days')
        GROUP BY date
        ORDER BY date ASC
    """, (user_id,)).fetchall()

    conn.close()

    this_week_list = [dict(r) for r in this_week]
    last_week_list = [dict(r) for r in last_week]

    # calculate stats
    def calc_stats(data, goal):
        if not data:
            return {
                "avg_calories": 0,
                "total_calories": 0,
                "days_tracked": 0,
                "goal_achieved_days": 0,
                "best_day": None,
                "worst_day": None
            }
        
        total = sum(d["total_calories"] for d in data)
        avg   = total / len(data)
        
        goal_days = sum(
            1 for d in data 
            if d["total_calories"] <= goal
        )
        
        best  = max(data, key=lambda x: x["total_calories"])
        worst = min(data, key=lambda x: x["total_calories"])

        return {
            "avg_calories": round(avg),
            "total_calories": total,
            "days_tracked": len(data),
            "goal_achieved_days": goal_days,
            "best_day": dict(best),
            "worst_day": dict(worst)
        }

    this_stats = calc_stats(this_week_list, daily_goal)
    last_stats = calc_stats(last_week_list, daily_goal)

    # calculate trend
    if last_stats["avg_calories"] > 0:
        change = this_stats["avg_calories"] - last_stats["avg_calories"]
        change_pct = round((change / last_stats["avg_calories"]) * 100, 1)
    else:
        change = 0
        change_pct = 0

    trend = "improving" if change < 0 else "declining" if change > 0 else "stable"

    return jsonify({
        "this_week": {
            "data": this_week_list,
            "stats": this_stats
        },
        "last_week": {
            "data": last_week_list,
            "stats": last_stats
        },
        "comparison": {
            "calorie_change": change,
            "change_percentage": change_pct,
            "trend": trend,
            "daily_goal": daily_goal
        }
    }), 200
# GET /analytics/nutrient-status?user_id=1
@analytics_bp.route("/nutrient-status", methods=["GET", "OPTIONS"])
def get_nutrient_status():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    daily_goal = 2000
    consumed_calories = 0
    consumed_water = 0

    try:
        conn = get_db()

        # 1. Fetch Goal safely
        try:
            goal_row = conn.execute(
                "SELECT daily_goal FROM goals WHERE user_id = ?",
                (user_id,)
            ).fetchone()
            if goal_row and goal_row["daily_goal"]:
                daily_goal = int(goal_row["daily_goal"])
        except Exception as e:
            print(f"Goal query fallback: {e}")

        # 2. Sum today's meals safely
        try:
            today_meals = conn.execute("""
                SELECT SUM(calories) as total_cals
                FROM meals
                WHERE user_id = ? AND date = date('now')
            """, (user_id,)).fetchone()
            if today_meals and today_meals["total_cals"]:
                consumed_calories = int(today_meals["total_cals"])
        except Exception as e:
            print(f"Meals query fallback: {e}")

        # 3. Sum today's water safely from daily_logs or water_logs
        try:
            # Check daily_logs first
            water_row = conn.execute("""
                SELECT water FROM daily_logs 
                WHERE user_id = ? AND date = date('now')
            """, (user_id,)).fetchone()
            if water_row and water_row["water"]:
                consumed_water = int(water_row["water"])
        except Exception:
            try:
                # Fallback check for water_logs table if used
                water_row = conn.execute("""
                    SELECT SUM(amount_ml) as total_water FROM water_logs 
                    WHERE user_id = ? AND date = date('now')
                """, (user_id,)).fetchone()
                if water_row and water_row["total_water"]:
                    consumed_water = int(water_row["total_water"])
            except Exception:
                consumed_water = 0

        conn.close()
    except Exception as db_err:
        print(f"Database error in nutrient-status: {db_err}")

    # Standard Macro Calculations
    protein_goal = round((daily_goal * 0.30) / 4)
    carbs_goal = round((daily_goal * 0.45) / 4)
    fat_goal = round((daily_goal * 0.25) / 9)
    water_goal = 2500

    consumed_protein = round((consumed_calories * 0.25) / 4)
    consumed_carbs = round((consumed_calories * 0.50) / 4)
    consumed_fat = round((consumed_calories * 0.25) / 9)

    def evaluate(name, consumed, target, unit):
        diff = consumed - target
        pct = round((consumed / target) * 100) if target > 0 else 0
        
        if pct < 85:
            status = "Deficit"
            color = "#f59e0b"
            msg = f"{abs(diff)} {unit} below target"
        elif 85 <= pct <= 115:
            status = "Optimal"
            color = "#10b981"
            msg = "On track"
        else:
            status = "Excess"
            color = "#ef4444"
            msg = f"{diff} {unit} above target"

        return {
            "nutrient": name,
            "consumed": consumed,
            "target": target,
            "unit": unit,
            "percentage": pct,
            "status": status,
            "color": color,
            "message": msg
        }

    nutrients = [
        evaluate("Calories", consumed_calories, daily_goal, "kcal"),
        evaluate("Protein", consumed_protein, protein_goal, "g"),
        evaluate("Carbs", consumed_carbs, carbs_goal, "g"),
        evaluate("Fats", consumed_fat, fat_goal, "g"),
        evaluate("Hydration", consumed_water, water_goal, "ml")
    ]

    return jsonify({
        "nutrients": nutrients,
        "summary": {
            "calories_consumed": consumed_calories,
            "calories_target": daily_goal,
            "water_consumed_ml": consumed_water,
            "water_target_ml": water_goal
        }
    }), 200
    # Standard macro splits based on consumed calories: 25% protein, 50% carbs, 25% fat
    consumed_protein = round((consumed_calories * 0.25) / 4)
    consumed_carbs = round((consumed_calories * 0.50) / 4)
    consumed_fat = round((consumed_calories * 0.25) / 9)

    # Helper function to classify status
    def evaluate(name, consumed, target, unit):
        diff = consumed - target
        pct = round((consumed / target) * 100) if target > 0 else 0
        
        if pct < 85:
            status = "Deficit"
            color = "#f59e0b"  # Yellow/Amber
            msg = f"{abs(diff)} {unit} below target"
        elif 85 <= pct <= 115:
            status = "Optimal"
            color = "#10b981"  # Green
            msg = "On track"
        else:
            status = "Excess"
            color = "#ef4444"  # Red
            msg = f"{diff} {unit} above target"

        return {
            "nutrient": name,
            "consumed": consumed,
            "target": target,
            "unit": unit,
            "percentage": pct,
            "status": status,
            "color": color,
            "message": msg
        }

    nutrients = [
        evaluate("Calories", consumed_calories, daily_goal, "kcal"),
        evaluate("Protein", consumed_protein, protein_goal, "g"),
        evaluate("Carbs", consumed_carbs, carbs_goal, "g"),
        evaluate("Fats", consumed_fat, fat_goal, "g"),
        evaluate("Hydration", consumed_water, water_goal, "ml")
    ]

    return jsonify({
        "nutrients": nutrients,
        "summary": {
            "calories_consumed": consumed_calories,
            "calories_target": daily_goal,
            "water_consumed_ml": consumed_water,
            "water_target_ml": water_goal
        }
    }), 200