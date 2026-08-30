


# from flask import Blueprint, jsonify, request
# from database.database import get_db

# # Ensure the Blueprint is named 'food_bp'
# food_bp = Blueprint("food", __name__)

# @food_bp.route("/add", methods=["POST", "OPTIONS"])
# def add_food():
#     if request.method == "OPTIONS":
#         return jsonify({"status": "ok"}), 200

#     data = request.get_json(silent=True) or {}
#     user_id = data.get("user_id")
#     food = data.get("food", "").strip()
#     meal_type = data.get("meal_type", "snack").lower()
#     date_str = data.get("date")

#     try:
#         calories = int(data.get("calories", 0))
#     except (ValueError, TypeError):
#         calories = 0

#     if not user_id or not food:
#         return jsonify({"error": "user_id and food are required"}), 400

#     conn = get_db()
#     cursor = conn.cursor()
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS meals (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             user_id INTEGER NOT NULL,
#             food TEXT NOT NULL,
#             calories INTEGER NOT NULL,
#             meal_type TEXT DEFAULT 'snack',
#             date TEXT DEFAULT CURRENT_DATE
#         )
#     """)
#     cursor.execute("""
#         INSERT INTO meals (user_id, food, calories, meal_type, date)
#         VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE))
#     """, (user_id, food, calories, meal_type, date_str))
#     conn.commit()
#     conn.close()

#     return jsonify({"message": "Meal added successfully!", "calories": calories}), 201


# @food_bp.route("/list", methods=["GET", "OPTIONS"])
# def list_food():
#     if request.method == "OPTIONS":
#         return jsonify({"status": "ok"}), 200

#     user_id = request.args.get("user_id")
#     date_str = request.args.get("date")

#     if not user_id:
#         return jsonify({"error": "user_id is required"}), 400

#     conn = get_db()
#     cursor = conn.cursor()
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS meals (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             user_id INTEGER NOT NULL,
#             food TEXT NOT NULL,
#             calories INTEGER NOT NULL,
#             meal_type TEXT DEFAULT 'snack',
#             date TEXT DEFAULT CURRENT_DATE
#         )
#     """)

#     if date_str:
#         cursor.execute(
#             "SELECT id, user_id, food, calories, meal_type, date FROM meals WHERE user_id = ? AND date = ?",
#             (user_id, date_str)
#         )
#     else:
#         cursor.execute(
#             "SELECT id, user_id, food, calories, meal_type, date FROM meals WHERE user_id = ? AND date = CURRENT_DATE",
#             (user_id,)
#         )

#     rows = cursor.fetchall()
#     conn.close()

#     meals = [dict(row) for row in rows]
#     return jsonify({"meals": meals}), 200









from flask import Blueprint, jsonify, request
from database.database import get_db

food_bp = Blueprint("food", __name__)


# -------------------------------------------------------------
# 1. Add a New Meal (/food/add)
# -------------------------------------------------------------
@food_bp.route("/add", methods=["POST", "OPTIONS"])
def add_food():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    food = data.get("food", "").strip()
    meal_type = data.get("meal_type", "snack").lower()
    date_str = data.get("date")

    try:
        calories = int(data.get("calories", 0))
    except (ValueError, TypeError):
        calories = 0

    if not user_id or not food:
        return jsonify({"error": "user_id and food are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food TEXT NOT NULL,
            calories INTEGER NOT NULL,
            meal_type TEXT DEFAULT 'snack',
            date TEXT DEFAULT CURRENT_DATE
        )
    """)
    cursor.execute("""
        INSERT INTO meals (user_id, food, calories, meal_type, date)
        VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE))
    """, (user_id, food, calories, meal_type, date_str))
    conn.commit()
    conn.close()

    return jsonify({"message": "Meal added successfully!", "calories": calories}), 201


# -------------------------------------------------------------
# 2. List Logged Meals (/food/list)
# -------------------------------------------------------------
@food_bp.route("/list", methods=["GET", "OPTIONS"])
def list_food():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    user_id = request.args.get("user_id")
    date_str = request.args.get("date")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food TEXT NOT NULL,
            calories INTEGER NOT NULL,
            meal_type TEXT DEFAULT 'snack',
            date TEXT DEFAULT CURRENT_DATE
        )
    """)

    if date_str:
        cursor.execute(
            "SELECT id, user_id, food, calories, meal_type, date FROM meals WHERE user_id = ? AND date = ?",
            (user_id, date_str)
        )
    else:
        cursor.execute(
            "SELECT id, user_id, food, calories, meal_type, date FROM meals WHERE user_id = ? AND date = CURRENT_DATE",
            (user_id,)
        )

    rows = cursor.fetchall()
    conn.close()

    meals = [dict(row) for row in rows]
    return jsonify({"meals": meals}), 200


# -------------------------------------------------------------
# 3. Delete a Meal Entry (/food/<int:meal_id>)
# -------------------------------------------------------------
@food_bp.route("/<int:meal_id>", methods=["DELETE", "OPTIONS"])
@food_bp.route("/delete/<int:meal_id>", methods=["DELETE", "OPTIONS"])
def delete_meal(meal_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Meal #{meal_id} deleted successfully"}), 200


# -------------------------------------------------------------
# 4. Update a Meal Entry (/food/<int:meal_id>)
# -------------------------------------------------------------
@food_bp.route("/<int:meal_id>", methods=["PUT", "OPTIONS"])
@food_bp.route("/update/<int:meal_id>", methods=["PUT", "OPTIONS"])
def update_meal(meal_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    calories = data.get("calories")
    food = data.get("food")

    conn = get_db()
    cursor = conn.cursor()

    if calories is not None and food is not None:
        cursor.execute(
            "UPDATE meals SET food = ?, calories = ? WHERE id = ?",
            (food, int(calories), meal_id)
        )
    elif calories is not None:
        cursor.execute(
            "UPDATE meals SET calories = ? WHERE id = ?",
            (int(calories), meal_id)
        )
    elif food is not None:
        cursor.execute(
            "UPDATE meals SET food = ? WHERE id = ?",
            (food, meal_id)
        )

    conn.commit()
    conn.close()

    return jsonify({"message": f"Meal #{meal_id} updated successfully"}), 200