class FoodItem:
    def __init__(self, id, food_name, calories, protein, carbs, fat):
        self.id = id
        self.food_name = food_name
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat

    def to_dict(self):
        return {
            "id": self.id,
            "food_name": self.food_name,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat
        }