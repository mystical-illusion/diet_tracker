import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useLogStore } from "../store/logStore";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import CalorieSummary from "../components/CalorieSummary";
import { WeeklyCalorieChart } from "../components/NutritionChart";

const MEAL_TYPES = ["Auto", "Breakfast", "Lunch", "Dinner", "Snack"];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { totals, fetchLogs } = useLogStore();
  const { goal, fetchGoal } = useGoalStore();

  const [weeklyData, setWeeklyData] = useState([]);
  const [meals, setMeals] = useState([]);
  const [aiText, setAiText] = useState("");
  const [mealPref, setMealPref] = useState("Auto");
  const today = format(new Date(), "yyyy-MM-dd");

  // water with localStorage persistence
  const [water, setWater] = useState(() => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("water_today") || "0");
  });

  // save water to localStorage on change
  useEffect(() => {
    localStorage.setItem("water_today", water.toString());
  }, [water]);

  useEffect(() => {
    fetchLogs(today);
    fetchGoal();
    loadMeals();
    loadWeeklyData();
  }, []);

  // load user's meals
  const loadMeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/food/list?user_id=${user?.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setMeals(data.meals || []);
    } catch {}
  };

  // build weekly data from meals
  const loadWeeklyData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/food/list?user_id=${user?.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      const meals = data.meals || [];

      // group by date
      const grouped = {};
      meals.forEach((meal) => {
        if (!grouped[meal.date]) {
          grouped[meal.date] = 0;
        }
        grouped[meal.date] += meal.calories;
      });

      // convert to array
      const weekly = Object.entries(grouped).map(([date, calories]) => ({
        date,
        calories,
      }));
      setWeeklyData(weekly);
    } catch {}
  };

  const calorieGoal = goal?.daily_goal || 2000;
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const waterGoal = 2000;
  const waterPct = Math.min((water / waterGoal) * 100, 100);

  return (
    <div className="page">
      {/* Header */}
      <div className="row-between mb-4">
        <div>
          <div className="dash-greeting">
            Hi, {user?.username || "Nutrition Expert"} 👋
          </div>
          <div className="dash-date">
            📅 Today is {format(new Date(), "EEEE, MMM d")}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => (window.location.href = "/log")}
        >
          + Manual Food Log
        </button>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          {/* Smart Logger */}
          <div className="card">
            <div className="row gap-3 mb-3">
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "var(--cyan-tint)",
                  border: "1px solid var(--cyan-tint2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                ⚡
              </div>
              <div className="flex-1">
                <div className="row gap-2">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Smart Logger
                  </span>
                  <span className="badge badge-cyan">ACTIVE</span>
                </div>
                <p className="text-xs text-subtle mt-1">
                  Describe what you ate in natural language
                </p>
              </div>
            </div>

            {/* Contained block that dynamically adapts to input lines */}
            <div
              className="ai-logger-wrap"
              style={{
                display: "flex",
                width: "100%",
                alignItems: "stretch",
                position: "relative",
                boxSizing: "border-box",
              }}
            >
              <textarea
                className="ai-logger-textarea"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="e.g. I had two boiled eggs and toast..."
                rows={Math.max(1, aiText.split("\n").length)} // 🎯 Starts small (1 row), scales up automatically as you go longer!
                style={{
                  flex: 1,
                  resize: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "36px", // Small baseline height when empty
                }}
              />
              <button
                className="ai-logger-send"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "45px",
                  flexShrink: 0,
                }}
              >
                ➤
              </button>
            </div>

            <div className="row-between mt-3">
              <div className="row gap-2">
                <span className="text-xxs text-subtle uppercase">
                  Preference:
                </span>
                <div className="row gap-1">
                  {MEAL_TYPES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMealPref(m)}
                      className={`filter-tab ${mealPref === m ? "active" : ""}`}
                      style={{ padding: "3px 10px", fontSize: 11 }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7-day chart */}
          <div className="card">
            <div className="row-between mb-1">
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                7-Day Calorie Intakes
              </span>
              <div
                style={{
                  padding: "4px 12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Target: {calorieGoal} kcal
              </div>
            </div>
            <div className="chart-wrap">
              <WeeklyCalorieChart data={weeklyData} />
            </div>
          </div>

          {/* Today's Meals */}
          <div className="card">
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
              Today's Meals
            </p>
            {meals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🍽️</div>
                <div className="empty-state-title">No meals logged</div>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {meals.map((meal) => (
                  <li
                    key={meal.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span>{meal.food}</span>
                    <span style={{ color: "var(--cyan)" }}>
                      {meal.calories} kcal
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="dash-right">
          {/* Calorie Summary */}
          <CalorieSummary totals={{ calories: totalCalories }} goal={goal} />

          {/* Hydration */}
          <div className="card">
            <div className="row-between mb-2">
              <div className="row gap-2">
                <span>💧</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  Hydration Station
                </div>
              </div>
              <span className="badge badge-cyan">
                {water} / {waterGoal} ml
              </span>
            </div>
            <div className="hydration-bar-wrap">
              <div
                className="hydration-fill"
                style={{ height: `${waterPct}%` }}
              >
                {waterPct > 10 && (
                  <span className="hydration-pct">{waterPct.toFixed(0)}%</span>
                )}
              </div>
            </div>
            <div className="hydration-btns">
              {[250, 500, 750].map((ml) => (
                <button
                  key={ml}
                  className="hydration-btn"
                  onClick={() => setWater((w) => Math.min(w + ml, waterGoal))}
                >
                  +{ml}ml
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
