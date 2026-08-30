# from flask import Blueprint, jsonify, request
# from database.database import get_db

# goal_bp = Blueprint("goal", __name__)

# @goal_bp.route("/<int:user_id>", methods=["GET"])
# def get_goal(user_id):
#     conn = get_db()
#     goal = conn.execute(
#         "SELECT * FROM goals WHERE user_id = ?",
#         (user_id,)          # ← user_id not meal_id!
#     ).fetchone()
#     conn.close()

#     if goal:
#         return jsonify({"goal": dict(goal)}), 200
#     return jsonify({"message": "goal not found!"}), 404
#     pass


# @goal_bp.route("/", methods=["POST"])
# def set_goal():
#     data = request.get_json(silent=True)
    
#     if not data:
#         return jsonify({"error": "no data sent"}), 400
#     if "user_id" not in data or "daily_goal" not in data:
#         return jsonify({"error": "user_id and daily_goal required"}), 400

#     conn = get_db()
    
#     # check if goal already exists
#     existing = conn.execute(
#         "SELECT * FROM goals WHERE user_id = ?",
#         (data["user_id"],)
#     ).fetchone()

#     if existing:
#         # UPDATE instead of INSERT
#         conn.execute(
#             "UPDATE goals SET daily_goal = ? WHERE user_id = ?",
#             (data["daily_goal"], data["user_id"])
#         )
#         message = "goal updated!"
#     else:
#         # INSERT new goal
#         conn.execute(
#             "INSERT INTO goals (user_id, daily_goal) VALUES (?, ?)",
#             (data["user_id"], data["daily_goal"])
#         )
#         message = "goal set!"

#     conn.commit()
#     conn.close()
#     return jsonify({"message": message}), 201
# @goal_bp.route("/<int:user_id>", methods=["PUT"])
# def update_goal(user_id):
#     # get new goal from body
#     # update in database
#     # return 200
#     data = request.get_json(silent=True)
#     conn = get_db()

#     goal = conn.execute(
#         "SELECT * FROM goals WHERE user_id = ?",
#         (user_id,)          # ← user_id not meal_id!
#     ).fetchone()

#     if goal:
#         conn.execute(
#             "UPDATE goals SET daily_goal = ? WHERE user_id = ?",
#             (data["daily_goal"], user_id)  # ← goals not meals!
#         )
#         conn.commit()
#         conn.close()
#         return jsonify({"message": "goal updated!"}), 200

#     conn.close()
#     return jsonify({"message": "goal not found!"}), 404
#     pass










from flask import Blueprint, jsonify, request
from database.database import get_db

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