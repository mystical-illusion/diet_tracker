class MealLog:
    def __init__(self, id, user_id, food, calories, date):
        self.id = id
        self.user_id = user_id
        self.food = food
        self.calories = calories
        self.date = date

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "food": self.food,
            "calories": self.calories,
            "date": self.date
        }