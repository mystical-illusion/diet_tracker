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