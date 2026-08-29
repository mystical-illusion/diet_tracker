import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useLogStore } from "../store/logStore";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import CalorieSummary from "../components/CalorieSummary";
import { WeeklyCalorieChart } from "../components/NutritionChart";
import AIChat from "../components/AIChat";

const MEAL_TYPES = ["Auto", "Breakfast", "Lunch", "Dinner", "Snack"];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { totals, fetchLogs } = useLogStore();
  const { goal, fetchGoal } = useGoalStore();

  const [weeklyData, setWeeklyData] = useState([]);
  const [meals, setMeals] = useState([]);
  const [aiText, setAiText] = useState("");
  const [mealPref, setMealPref] = useState("Auto");
  const [loading, setLoading] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  // Water with localStorage persistence
  const [water, setWater] = useState(() => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("water_today") || "0", 10);
  });

  // Save water to localStorage on change
  useEffect(() => {
    localStorage.setItem("water_today", water.toString());
  }, [water]);

  const loadWater = () => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      setWater(0);
    } else {
      setWater(parseInt(localStorage.getItem("water_today") || "0", 10));
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchGoal();
      loadMeals();
      loadWeeklyData();
      loadWater();
    }
  }, [user?.id]);

  // Load user's meals
  const loadMeals = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/food/list?user_id=${user.id}&date=${today}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setMeals(data.meals || []);
    } catch (err) {
      console.error("Meals loading error:", err);
    }
  };

  // Build weekly data from analytics
  const loadWeeklyData = async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/analytics/daily?user_id=${user.id}&days=7`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();

      const formatted = (data.daily || []).map((item) => ({
        date: item.date,
        calories: item.total_calories || item.calories || 0,
        meal_count: item.meal_count || 0,
      }));

      setWeeklyData(formatted);
    } catch (err) {
      console.error("Weekly data error:", err);
    }
  };

  const calorieGoal = goal?.daily_goal || 2000;
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const waterGoal = 2000;
  const waterPct = Math.min((water / waterGoal) * 100, 100);

  // Smart Logger
  async function handleSmartLog() {
    if (!aiText.trim() || loading || !user?.id) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Step 1: Ask AI to extract food and calories
      const aiResponse = await fetch(
        "http://127.0.0.1:5001/nutrition/ai-extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: aiText,
            meal_type: mealPref.toLowerCase(),
          }),
        },
      );
      const aiData = await aiResponse.json();

      // Step 2: Log extracted meals
      if (aiData.meals && aiData.meals.length > 0) {
        const finalMealType =
          mealPref.toLowerCase() === "auto"
            ? (aiData.meal_type || "snack").toLowerCase()
            : mealPref.toLowerCase();

        for (const meal of aiData.meals) {
          await fetch("http://127.0.0.1:5001/food/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: user.id,
              food: meal.food,
              calories: meal.calories,
              meal_type: finalMealType,
              date: today,
            }),
          });
        }
        setAiText("");
        await loadMeals();
        await loadWeeklyData();
      } else {
        alert("Could not detect any food items in the text.");
      }
    } catch (err) {
      console.error("Smart log error:", err);
      alert("Failed to process meal");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSmartLog();
    }
  };

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
                onKeyDown={handleKeyDown}
                placeholder="e.g. I had two boiled eggs and toast..."
                rows={Math.max(1, aiText.split("\n").length)}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "36px",
                }}
              />
              <button
                className="ai-logger-send"
                onClick={handleSmartLog}
                disabled={!aiText.trim() || loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "45px",
                  flexShrink: 0,
                  cursor: !aiText.trim() || loading ? "not-allowed" : "pointer",
                  opacity: !aiText.trim() || loading ? 0.6 : 1,
                }}
              >
                {loading ? "..." : "➤"}
              </button>
            </div>

            <div className="row-between mt-3">
              <div className="row gap-2" style={{ alignItems: "center" }}>
                <span className="text-xxs text-subtle uppercase">
                  Preference:
                </span>
                <div
                  className="row gap-1"
                  style={{ display: "flex", gap: "6px" }}
                >
                  {MEAL_TYPES.map((m) => {
                    const isSelected =
                      mealPref.toLowerCase() === m.toLowerCase();
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMealPref(m)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: isSelected
                            ? "1px solid var(--cyan, #00d2ff)"
                            : "1px solid var(--border, #333)",
                          background: isSelected
                            ? "rgba(0, 210, 255, 0.15)"
                            : "var(--surface-2, #1a1a24)",
                          color: isSelected
                            ? "var(--cyan, #00d2ff)"
                            : "var(--text-muted, #aaa)",
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
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

          {/* Categorized Today's Meals */}
          <div className="card">
            <div className="row-between mb-3">
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Today's Meals
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>
                {meals.length} {meals.length === 1 ? "item" : "items"}
              </span>
            </div>

            {meals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🍽️</div>
                <div className="empty-state-title">No meals logged</div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {[
                  { title: "Breakfast", icon: "🍳", key: "breakfast" },
                  { title: "Lunch", icon: "🥗", key: "lunch" },
                  { title: "Dinner", icon: "🍲", key: "dinner" },
                  { title: "Snack", icon: "🍎", key: "snack" },
                ].map((cat) => {
                  const catMeals = meals.filter(
                    (m) => (m.meal_type || "snack").toLowerCase() === cat.key,
                  );
                  const catTotal = catMeals.reduce(
                    (sum, m) => sum + (m.calories || 0),
                    0,
                  );

                  return (
                    <div
                      key={cat.key}
                      style={{
                        background: "var(--surface-2, #15151e)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        border: "1px solid var(--border, #2a2a38)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: catMeals.length > 0 ? "6px" : "0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {cat.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              catTotal > 0 ? "var(--cyan, #00d2ff)" : "#666",
                          }}
                        >
                          {catTotal} kcal
                        </span>
                      </div>

                      {catMeals.length > 0 ? (
                        <ul
                          style={{ listStyle: "none", padding: 0, margin: 0 }}
                        >
                          {catMeals.map((meal) => (
                            <li
                              key={meal.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 12,
                                padding: "4px 0",
                                color: "var(--text, #ddd)",
                                borderTop:
                                  "1px solid var(--border, rgba(255,255,255,0.05))",
                              }}
                            >
                              <span>{meal.food}</span>
                              <span
                                style={{ color: "var(--text-muted, #888)" }}
                              >
                                {meal.calories} kcal
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ fontSize: 11, color: "#666" }}>
                          No food logged
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <AIChat />
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
