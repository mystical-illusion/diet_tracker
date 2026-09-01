import os
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from database.database import get_db
import google.generativeai as genai

analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")


# 1. Range Analytics (7D / 15D / 30D multi-window trend & rule suggestions)
@analytics_bp.route("/range", methods=["GET", "OPTIONS"])
def get_range_data():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    days = request.args.get("days", 7, type=int)

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        conn = get_db()

        # Compute starting date window
        start_date_str = (datetime.now() - timedelta(days=days - 1)).strftime("%Y-%m-%d")

        # 1. Fetch Daily Calories
        daily_rows = conn.execute("""
            SELECT 
                date,
                SUM(calories) as total_calories,
                COUNT(*) as meal_count
            FROM meals
            WHERE user_id = ?
            AND date >= ?
            GROUP BY date
            ORDER BY date ASC
        """, (user_id, start_date_str)).fetchall()

        daily_map = {r["date"]: dict(r) for r in daily_rows}

        # 2. Meal Type Distribution
        meal_types = conn.execute("""
            SELECT 
                COALESCE(meal_type, 'general') as meal_type,
                SUM(calories) as total_calories,
                COUNT(*) as count
            FROM meals
            WHERE user_id = ?
            AND date >= ?
            GROUP BY meal_type
        """, (user_id, start_date_str)).fetchall()

        # 3. User Goal Target
        goal = conn.execute(
            "SELECT daily_goal FROM goals WHERE user_id = ?",
            (user_id,)
        ).fetchone()
        daily_goal = int(goal["daily_goal"]) if goal and goal["daily_goal"] else 2000

        # 4. Streak Calculation
        all_dates = conn.execute("""
            SELECT DISTINCT date
            FROM meals
            WHERE user_id = ?
            ORDER BY date DESC
        """, (user_id,)).fetchall()

        # 5. Hydration Logs
        hydration_rows = conn.execute("""
            SELECT date, water
            FROM daily_logs
            WHERE user_id = ?
            AND date >= ?
            ORDER BY date ASC
        """, (user_id, start_date_str)).fetchall()
        hydration_map = {r["date"]: int(r["water"] or 0) for r in hydration_rows}

        conn.close()

        # Continuous Date Padding for balanced charts
        today = datetime.now().date()
        padded_daily = []
        padded_hydration = []
        total_period_calories = 0
        total_period_water = 0
        logged_days_count = 0
        goal_days = 0

        for i in range(days - 1, -1, -1):
            cur_date = today - timedelta(days=i)
            cur_str = str(cur_date)
            display_label = cur_str[5:]  # '08-31', '09-01'

            cals = int(daily_map[cur_str]["total_calories"]) if cur_str in daily_map else 0
            meal_cnt = int(daily_map[cur_str]["meal_count"]) if cur_str in daily_map else 0
            water_val = hydration_map.get(cur_str, 0)

            if cals > 0:
                logged_days_count += 1
                total_period_calories += cals
                if abs(cals - daily_goal) <= (daily_goal * 0.10):
                    goal_days += 1

            total_period_water += water_val

            padded_daily.append({
                "date": display_label,
                "full_date": cur_str,
                "total_calories": cals,
                "meal_count": meal_cnt,
                "target": daily_goal
            })

            padded_hydration.append({
                "date": display_label,
                "full_date": cur_str,
                "water": water_val
            })

        # Calculate Current Streak
        streak = 0
        check_date = today
        date_set = {r["date"] for r in all_dates}
        while str(check_date) in date_set:
            streak += 1
            check_date -= timedelta(days=1)

        avg_calories = round(total_period_calories / logged_days_count) if logged_days_count > 0 else 0
        avg_water = round(total_period_water / logged_days_count) if logged_days_count > 0 else 0
        target_hit_rate = round((goal_days / logged_days_count * 100), 1) if logged_days_count > 0 else 0.0

        # Auto-Generated Insights & Suggestions
        suggestions = []
        if avg_calories > daily_goal * 1.10:
            suggestions.append({
                "type": "warning",
                "title": "Caloric Surplus Trend",
                "message": f"Over the past {days} days, you averaged {avg_calories} kcal/day ({avg_calories - daily_goal} kcal above target)."
            })
        elif avg_calories < daily_goal * 0.85 and logged_days_count > 0:
            suggestions.append({
                "type": "info",
                "title": "Caloric Deficit Trend",
                "message": f"You are averaging {daily_goal - avg_calories} kcal below your target. Ensure you maintain adequate protein intake."
            })
        else:
            suggestions.append({
                "type": "success",
                "title": "Consistent Calorie Balance",
                "message": f"Your {days}-day average of {avg_calories} kcal/day aligns closely with your {daily_goal} kcal goal."
            })

        if avg_water < 2000:
            suggestions.append({
                "type": "warning",
                "title": "Hydration Needs Attention",
                "message": f"Average daily water is {avg_water} ml (target: 2500 ml). Try adding an extra glass with meals."
            })

        return jsonify({
            "daily": padded_daily,
            "meal_types": [dict(r) for r in meal_types],
            "hydration": padded_hydration,
            "suggestions": suggestions,
            "stats": {
                "days_tracked": logged_days_count,
                "total_days_in_period": days,
                "avg_calories": avg_calories,
                "avg_water": avg_water,
                "streak": streak,
                "goal_achieved_days": goal_days,
                "target_hit_rate": target_hit_rate,
                "daily_goal": daily_goal
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 2. Gemini AI Pattern Analysis



@analytics_bp.route("/ai-insights", methods=["GET", "OPTIONS"])
def ai_insights():
    # 1. Handle CORS preflight
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    days = request.args.get("days", 7, type=int)

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        conn = get_db()

        # 2. Fetch daily calorie totals safely
        daily_totals = conn.execute("""
            SELECT date, strftime('%w', date) as day_of_week, SUM(calories) as total_cals
            FROM meals
            WHERE user_id = ? AND date >= date('now', ?)
            GROUP BY date
            ORDER BY date DESC
        """, (user_id, f'-{days} days')).fetchall()

        # 3. Fetch goal
        goal = conn.execute(
            "SELECT daily_goal FROM goals WHERE user_id = ?",
            (user_id,)
        ).fetchone()

        conn.close()

        daily_goal = int(goal["daily_goal"]) if goal and goal["daily_goal"] else 2000
        days_logged = len(daily_totals)

        # Fallback if no logs are found
        if days_logged == 0:
            return jsonify({
                "insights": f"• No meals logged in the last {days} days.\n• Start logging your meals to receive AI pattern insights!\n• Target daily calorie goal is {daily_goal} kcal."
            }), 200

        # Calculate quick deterministic stats
        total_period_cals = sum(int(r["total_cals"] or 0) for r in daily_totals)
        avg_cals = round(total_period_cals / days_logged)

        # 4. Attempt Gemini Call Safely
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return jsonify({
                "insights": f"• Over the past {days} days, you logged {days_logged} day(s) averaging {avg_cals} kcal/day (Goal: {daily_goal} kcal).\n• Configure GEMINI_API_KEY in your .env file to enable automated generative dietary coaching."
            }), 200

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = (
                f"You are a clinical dietitian. The user has logged {days_logged} days over a {days}-day span. "
                f"Daily calorie goal: {daily_goal} kcal. Average intake: {avg_cals} kcal/day. "
                f"Provide 2-3 brief, highly actionable dietary coaching bullet points under 90 words."
            )
            response = model.generate_content(prompt)
            insights_text = response.text.strip() if response and response.text else None
        except Exception as ai_err:
            print("Gemini API call warning:", str(ai_err))
            insights_text = None

        # Fallback if AI generation failed
        if not insights_text:
            diff = avg_cals - daily_goal
            status_note = f"{abs(diff)} kcal above target" if diff > 0 else f"{abs(diff)} kcal below target"
            insights_text = (
                f"• Tracked {days_logged} of the last {days} days with an average of {avg_cals} kcal/day ({status_note}).\n"
                f"• Target Goal: {daily_goal} kcal/day.\n"
                f"• Consistency Tip: Keep balancing proteins and complex carbohydrates evenly across breakfast and lunch."
            )

        return jsonify({"insights": insights_text}), 200

    except Exception as e:
        print("Error inside /ai-insights route:", str(e))
        return jsonify({
            "insights": "Log your meals consistently to track caloric intake and personalized dietary recommendations."
        }), 200
# 3. Weekly Comparison (Current 7 days vs Previous 7 days)
@analytics_bp.route("/weekly-comparison", methods=["GET", "OPTIONS"])
def weekly_comparison():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        conn = get_db()
        
        this_week = conn.execute("""
            SELECT date, SUM(calories) as calories
            FROM meals
            WHERE user_id = ? AND date >= date('now', '-6 days')
            GROUP BY date
            ORDER BY date ASC
        """, (user_id,)).fetchall()

        last_week = conn.execute("""
            SELECT date, SUM(calories) as calories
            FROM meals
            WHERE user_id = ? AND date BETWEEN date('now', '-13 days') AND date('now', '-7 days')
            GROUP BY date
            ORDER BY date ASC
        """, (user_id,)).fetchall()

        conn.close()

        this_week_list = [dict(r) for r in this_week]
        last_week_list = [dict(r) for r in last_week]
        
        this_week_total = sum(int(r.get("calories") or 0) for r in this_week_list)
        last_week_total = sum(int(r.get("calories") or 0) for r in last_week_list)

        return jsonify({
            "this_week": this_week_list,
            "last_week": last_week_list,
            "this_week_total": this_week_total,
            "last_week_total": last_week_total
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analytics_bp.route("/daily", methods=["GET", "OPTIONS"])
def get_daily_analytics():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    days = request.args.get("days", 7, type=int)

    conn = get_db()
    start_date = (datetime.now() - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    
    rows = conn.execute("""
        SELECT date, SUM(calories) as calories
        FROM meals
        WHERE user_id = ? AND date >= ?
        GROUP BY date
        ORDER BY date ASC
    """, (user_id, start_date)).fetchall()
    conn.close()

    db_map = {r["date"]: r["calories"] for r in rows}
    
    # Pad 7 continuous days
    today = datetime.now().date()
    daily_list = []
    for i in range(days - 1, -1, -1):
        d_str = str(today - timedelta(days=i))
        daily_list.append({
            "date": d_str[5:],  # '08-31', '09-01'
            "calories": db_map.get(d_str, 0)
        })

    return jsonify({"daily": daily_list}), 200