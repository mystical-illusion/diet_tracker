from database.database import get_db

class FoodService:
    
    @staticmethod
    def add_meal(user_id, food, calories):
        conn = get_db()
        conn.execute(
            "INSERT INTO meals (user_id, food, calories) VALUES (?, ?, ?)",
            (user_id, food, calories)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_all_meals():
        conn = get_db()
        rows = conn.execute("SELECT * FROM meals").fetchall()
        conn.close()
        return [dict(row) for row in rows]
    
    @staticmethod
    def get_meal_by_id(meal_id):
        conn = get_db()
        meal = conn.execute(
            "SELECT * FROM meals WHERE id = ?",
            (meal_id,)
        ).fetchone()
        conn.close()
        return meal
    
    @staticmethod
    def update_meal(meal_id, food, calories):
        conn = get_db()
        conn.execute(
            "UPDATE meals SET food=?, calories=? WHERE id=?",
            (food, calories, meal_id)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def delete_meal(meal_id):
        conn = get_db()
        conn.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
        conn.commit()
        conn.close()



    @staticmethod
    def get_meals_by_user(user_id):
        conn = get_db()
        rows = conn.execute(
            "SELECT * FROM meals WHERE user_id = ?",
            (user_id,)
        ).fetchall()
        conn.close()
        return [dict(row) for row in rows]