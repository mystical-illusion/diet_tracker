import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import CalorieLineChart from "../components/charts/CalorieLineChart";
import WeeklyBarChart from "../components/charts/WeeklyBarChart";
import MacroPieChart from "../components/charts/MacroPieChart";
import GoalProgressChart from "../components/charts/GoalProgressChart";
const loadAnalytics = async () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // load all analytics
  const [statsRes, dailyRes, topFoodsRes] = await Promise.all([
    fetch(`http://127.0.0.1:5001/analytics/stats?user_id=${user?.id}`, {
      headers,
    }),
    fetch(`http://127.0.0.1:5001/analytics/daily?user_id=${user?.id}&days=7`, {
      headers,
    }),
    fetch(`http://127.0.0.1:5001/analytics/top-foods?user_id=${user?.id}`, {
      headers,
    }),
  ]);

  const stats = await statsRes.json();
  const daily = await dailyRes.json();
  const topFoods = await topFoodsRes.json();

  setStats(stats);
  setWeeklyData(daily.daily);
  setTopFoods(topFoods.top_foods);
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { goal, fetchGoal } = useGoalStore();
  const [meals, setMeals] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    fetchGoal();
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/food/list?user_id=${user?.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      const allMeals = data.meals || [];
      setMeals(allMeals);

      // group by date for charts
      const grouped = {};
      allMeals.forEach((meal) => {
        if (!grouped[meal.date]) {
          grouped[meal.date] = 0;
        }
        grouped[meal.date] += meal.calories;
      });

      const weekly = Object.entries(grouped)
        .map(([date, calories]) => ({ date, calories }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // last 7 days

      setWeeklyData(weekly);
    } catch {}
  };

  const totalCalories = meals
    .filter((m) => m.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, m) => sum + m.calories, 0);

  const calorieGoal = goal?.daily_goal || 2000;

  return (
    <div className="page">
      {/* Header */}
      <div className="section-header mb-4">
        <div className="section-title">📊 Analytics Dashboard</div>
        <p className="section-sub">
          Visual insights into your nutrition journey
        </p>
      </div>

      {/* Stats Row */}
      <div className="stat-row mb-4">
        <div className="stat-cell">
          <div className="stat-label">Total Meals</div>
          <div className="stat-value">{meals.length}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Today's Calories</div>
          <div className="stat-value">{totalCalories}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Daily Goal</div>
          <div className="stat-value">{calorieGoal}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Days Tracked</div>
          <div className="stat-value">
            {new Set(meals.map((m) => m.date)).size}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-2 gap-4 mb-4">
        <GoalProgressChart consumed={totalCalories} goal={calorieGoal} />
        <MacroPieChart protein={50} carbs={120} fat={30} />
      </div>

      <div className="mb-4">
        <WeeklyBarChart data={weeklyData} goal={calorieGoal} />
      </div>

      <div className="mb-4">
        <CalorieLineChart data={weeklyData} goal={calorieGoal} />
      </div>
    </div>
  );
}
