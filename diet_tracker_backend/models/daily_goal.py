class DailyGoal:
    def __init__(self, id, user_id, daily_goal):
        self.id = id
        self.user_id = user_id
        self.daily_goal = daily_goal

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "daily_goal": self.daily_goal
        }