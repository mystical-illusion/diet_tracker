class CalorieCalc:
    
    @staticmethod
    def calculate_total(meals):
        total = 0
        for meal in meals:
            total = total + meal["calories"]
        return total
    
    @staticmethod
    def calculate_remaining(daily_goal, total_consumed):
        return daily_goal - total_consumed