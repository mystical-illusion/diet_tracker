from flask import Blueprint, jsonify, request
from database.database import get_db

goal_bp = Blueprint("goal", __name__)

@goal_bp.route("/<int:user_id>", methods=["GET"])
def get_goal(user_id):
    conn = get_db()
    goal = conn.execute(
        "SELECT * FROM goals WHERE user_id = ?",
        (user_id,)          # ← user_id not meal_id!
    ).fetchone()
    conn.close()

    if goal:
        return jsonify({"goal": dict(goal)}), 200
    return jsonify({"message": "goal not found!"}), 404
    pass


@goal_bp.route("/", methods=["POST"])
def set_goal():
    data = request.get_json(silent=True)
    
    if not data:
        return jsonify({"error": "no data sent"}), 400
    if "user_id" not in data or "daily_goal" not in data:
        return jsonify({"error": "user_id and daily_goal required"}), 400

    conn = get_db()
    
    # check if goal already exists
    existing = conn.execute(
        "SELECT * FROM goals WHERE user_id = ?",
        (data["user_id"],)
    ).fetchone()

    if existing:
        # UPDATE instead of INSERT
        conn.execute(
            "UPDATE goals SET daily_goal = ? WHERE user_id = ?",
            (data["daily_goal"], data["user_id"])
        )
        message = "goal updated!"
    else:
        # INSERT new goal
        conn.execute(
            "INSERT INTO goals (user_id, daily_goal) VALUES (?, ?)",
            (data["user_id"], data["daily_goal"])
        )
        message = "goal set!"

    conn.commit()
    conn.close()
    return jsonify({"message": message}), 201
@goal_bp.route("/<int:user_id>", methods=["PUT"])
def update_goal(user_id):
    # get new goal from body
    # update in database
    # return 200
    data = request.get_json(silent=True)
    conn = get_db()

    goal = conn.execute(
        "SELECT * FROM goals WHERE user_id = ?",
        (user_id,)          # ← user_id not meal_id!
    ).fetchone()

    if goal:
        conn.execute(
            "UPDATE goals SET daily_goal = ? WHERE user_id = ?",
            (data["daily_goal"], user_id)  # ← goals not meals!
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "goal updated!"}), 200

    conn.close()
    return jsonify({"message": "goal not found!"}), 404
    pass