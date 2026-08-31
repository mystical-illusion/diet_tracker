import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import api from "../services/api";
import { useLogStore } from "../store/logStore";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import CalorieSummary from "../components/CalorieSummary";
import { WeeklyCalorieChart } from "../components/NutritionChart";
import AIChat from "../components/AIChat";
import NutrientBalance from "../components/NutrientBalance";
import BMICard from "../components/BMICard";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const today = format(new Date(), "yyyy-MM-dd");

  const userId = user?.id;

  // 1. Dynamic Water Target Goal
  const [waterGoal, setWaterGoal] = useState(() => {
    return parseInt(localStorage.getItem("water_goal") || "2500", 10);
  });

  // 2. Daily Water Intake State
  const [water, setWater] = useState(() => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("water_today") || "0", 10);
  });

  const [customWater, setCustomWater] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(waterGoal.toString());

  // Persist local hydration cache
  useEffect(() => {
    localStorage.setItem("water_today", water.toString());
  }, [water]);

  useEffect(() => {
    localStorage.setItem("water_goal", waterGoal.toString());
  }, [waterGoal]);

  // Sync initial water intake from backend
  const loadWater = useCallback(async () => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      setWater(0);
    } else {
      setWater(parseInt(localStorage.getItem("water_today") || "0", 10));
    }

    if (userId) {
      try {
        const res = await api.get(
          `/analytics/nutrient-status?user_id=${userId}&date=${today}`,
        );
        const dbWater = res.data?.summary?.water_consumed_ml;
        if (typeof dbWater === "number") {
          setWater(dbWater);
          localStorage.setItem("water_today", dbWater.toString());
        }
      } catch (err) {
        console.error("Error fetching water status:", err);
      }
    }
  }, [today, userId]);

  // Log water to state and backend
  const handleAddWater = async (amount) => {
    const num = parseInt(amount, 10);
    if (!isNaN(num) && num > 0) {
      setWater((prev) => prev + num);

      if (userId) {
        try {
          await api.post("/nutrition/water/add", {
            user_id: userId,
            amount_ml: num,
            date: today,
          });
          setRefreshKey((k) => k + 1);
        } catch (err) {
          console.error("Failed to sync water to backend:", err);
        }
      }
    }
  };

  // Reset water in state and backend
  const handleResetWater = async () => {
    setWater(0);
    localStorage.setItem("water_today", "0");

    if (userId) {
      try {
        await api.post("/nutrition/water/add", {
          user_id: userId,
          amount_ml: 0,
          reset: true,
          date: today,
        });
        setRefreshKey((k) => k + 1);
      } catch (err) {
        console.error("Failed to reset water on backend:", err);
      }
    }
  };

  const handleSaveGoal = () => {
    const parsed = parseInt(tempGoal, 10);
    if (!isNaN(parsed) && parsed >= 500) {
      setWaterGoal(parsed);
    }
    setIsEditingGoal(false);
  };

  // 3. Load user's meals for today
  const loadMeals = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/food/list?user_id=${userId}&date=${today}`);
      setMeals(res.data.meals || []);
    } catch (err) {
      console.error("Meals loading error:", err);
    }
  }, [userId, today]);

  // 4. Build weekly data from analytics
  const loadWeeklyData = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/analytics/daily?user_id=${userId}&days=7`);
      const formatted = (res.data.daily || []).map((item) => ({
        date: item.date,
        calories: item.total_calories || item.calories || 0,
        meal_count: item.meal_count || 0,
      }));
      setWeeklyData(formatted);
    } catch (err) {
      console.error("Weekly data error:", err);
    }
  }, [userId]);

  // 5. Data Initialization Hook
  useEffect(() => {
    if (userId) {
      fetchGoal();
      loadMeals();
      loadWeeklyData();
      loadWater();
    }
  }, [userId, fetchGoal, loadMeals, loadWeeklyData, loadWater]);

  const calorieGoal = Number(goal?.daily_goal) || 2000;
  const totalCalories = meals.reduce(
    (sum, m) => sum + (Number(m.calories) || 0),
    0,
  );

  const waterPct = waterGoal > 0 ? (water / waterGoal) * 100 : 0;
  const barFillPct = Math.min(waterPct, 100);

  // 6. Smart AI Logger Handler
  async function handleSmartLog() {
    if (!aiText.trim() || loading || !userId) return;
    setLoading(true);

    try {
      const aiResponse = await api.post("/nutrition/ai-extract", {
        text: aiText,
        meal_type: mealPref.toLowerCase(),
        user_id: userId,
      });

      const aiData = aiResponse.data;
      const extractedMeals = aiData.meals || (aiData.meal ? [aiData.meal] : []);

      if (extractedMeals.length > 0) {
        const finalMealType =
          mealPref.toLowerCase() === "auto"
            ? (
                aiData.meal_type ||
                aiData.meal?.meal_type ||
                "snack"
              ).toLowerCase()
            : mealPref.toLowerCase();

        for (const meal of extractedMeals) {
          await api.post("/food/add", {
            user_id: userId,
            food: meal.food || meal.food_name,
            calories: Number(meal.calories) || 250,
            meal_type: meal.meal_type || finalMealType,
            date: today,
          });
        }

        setAiText("");
        await loadMeals();
        await loadWeeklyData();
        setRefreshKey((k) => k + 1);
      } else {
        alert("Could not detect any food items in the text.");
      }
    } catch (err) {
      console.error("Smart log error:", err);
      alert("Failed to process meal with AI");
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
    <div
      className="page"
      style={{ padding: "20px", maxWidth: "1280px", margin: "0 auto" }}
    >
      {/* Header */}
      <div
        className="row-between mb-4"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            className="dash-greeting"
            style={{ fontSize: "20px", fontWeight: "700", color: "#fff" }}
          >
            Hi, {user?.username || "Nutrition Expert"} 👋
          </div>
          <div
            className="dash-date"
            style={{
              fontSize: "12px",
              color: "var(--text-muted, #94a3b8)",
              marginTop: "2px",
            }}
          >
            📅 Today is {format(new Date(), "EEEE, MMM d")}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => (window.location.href = "/log")}
          style={{
            padding: "8px 16px",
            background: "var(--cyan, #00d2ff)",
            border: "none",
            borderRadius: "6px",
            color: "#000",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          + Manual Food Log
        </button>
      </div>

      <div
        className="dash-grid"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}
      >
        {/* Left Main Column */}
        <div
          className="dash-main"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Smart Logger Card */}
          <div
            className="card"
            style={{
              background: "var(--surface-1, #1e293b)",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            <div
              className="row gap-3 mb-3"
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "rgba(0, 210, 255, 0.1)",
                  border: "1px solid rgba(0, 210, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                ⚡
              </div>
              <div className="flex-1">
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <span
                    style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}
                  >
                    Smart Logger
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      background: "rgba(0, 210, 255, 0.2)",
                      color: "#00d2ff",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    ACTIVE
                  </span>
                </div>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "11px",
                    color: "var(--text-muted, #94a3b8)",
                  }}
                >
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
                placeholder="e.g. I had two boiled eggs and whole wheat toast..."
                rows={Math.max(1, aiText.split("\n").length)}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "42px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  padding: "10px",
                  color: "#fff",
                  fontSize: "13px",
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
                  width: "48px",
                  marginLeft: "8px",
                  borderRadius: "6px",
                  background: "var(--cyan, #00d2ff)",
                  border: "none",
                  color: "#000",
                  fontWeight: "bold",
                  cursor: !aiText.trim() || loading ? "not-allowed" : "pointer",
                  opacity: !aiText.trim() || loading ? 0.6 : 1,
                }}
              >
                {loading ? "..." : "➤"}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted, #94a3b8)",
                    textTransform: "uppercase",
                  }}
                >
                  Preference:
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
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
                            : "1px solid #334155",
                          background: isSelected
                            ? "rgba(0, 210, 255, 0.15)"
                            : "#0f172a",
                          color: isSelected
                            ? "var(--cyan, #00d2ff)"
                            : "var(--text-muted, #94a3b8)",
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

          {/* 7-Day Calorie Chart */}
          <div
            className="card"
            style={{
              background: "var(--surface-1, #1e293b)",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
                7-Day Calorie Intakes
              </span>
              <div
                style={{
                  padding: "3px 10px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "var(--text-muted, #94a3b8)",
                }}
              >
                Target: {calorieGoal} kcal
              </div>
            </div>
            <WeeklyCalorieChart data={weeklyData} />
          </div>

          {/* Categorized Today's Meals */}
          <div
            className="card"
            style={{
              background: "var(--surface-1, #1e293b)",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
                Today's Meals
              </span>
              <span
                style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)" }}
              >
                {meals.length} {meals.length === 1 ? "item" : "items"}
              </span>
            </div>

            {meals.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                🍽️ No meals logged today yet.
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
                    (sum, m) => sum + (Number(m.calories) || 0),
                    0,
                  );

                  return (
                    <div
                      key={cat.key}
                      style={{
                        background: "#0f172a",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        border: "1px solid #334155",
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
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#fff",
                            }}
                          >
                            {cat.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              catTotal > 0 ? "var(--cyan, #00d2ff)" : "#64748b",
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
                              key={meal.id || meal.food}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 12,
                                padding: "4px 0",
                                color: "#cbd5e1",
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <span>{meal.food}</span>
                              <span
                                style={{ color: "var(--text-muted, #94a3b8)" }}
                              >
                                {meal.calories} kcal
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          No food logged
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Nutrition Coach Widget */}
          <AIChat />
        </div>

        {/* Right Sidebar Column */}
        <div
          className="dash-right"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Calorie Summary Ring */}
          <CalorieSummary
            totals={{ calories: totalCalories }}
            goal={goal || { daily_goal: 2000 }}
          />

          {/* BMI Card */}
          <BMICard />

          {/* Hydration Station */}
          <div
            className="card"
            style={{
              background: "var(--surface-1, #1e293b)",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "18px" }}>💧</span>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
                  Hydration Station
                </div>
              </div>

              {isEditingGoal ? (
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    step="100"
                    min="500"
                    style={{
                      width: "70px",
                      padding: "2px 6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      background: "#0f172a",
                      color: "#fff",
                      border: "1px solid var(--cyan, #00d2ff)",
                    }}
                  />
                  <button
                    onClick={handleSaveGoal}
                    style={{
                      padding: "2px 8px",
                      fontSize: "11px",
                      borderRadius: "4px",
                      background: "#00d2ff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "#000",
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => setIsEditingGoal(true)}
                  title="Click to edit water goal"
                  style={{
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--cyan, #00d2ff)",
                    background: "rgba(0, 210, 255, 0.1)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(0, 210, 255, 0.2)",
                  }}
                >
                  {water} / {waterGoal} ml ✏️
                </span>
              )}
            </div>

            {/* Hydration Bar */}
            <div
              style={{
                width: "100%",
                height: "18px",
                background: "#0f172a",
                borderRadius: "9px",
                overflow: "hidden",
                position: "relative",
                margin: "12px 0 8px 0",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  width: `${barFillPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #00d2ff, #0072ff)",
                  transition: "width 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: "#fff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {waterPct.toFixed(0)}%
              </span>
            </div>

            {/* Increment Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "6px",
                marginTop: "10px",
              }}
            >
              {[100, 250, 500, 1000].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => handleAddWater(ml)}
                  style={{
                    padding: "6px 0",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#00d2ff",
                    border: "1px solid #334155",
                    cursor: "pointer",
                  }}
                >
                  +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                </button>
              ))}
            </div>

            {/* Custom Log & Reset */}
            <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
              <input
                type="number"
                placeholder="+ml (e.g. 350)"
                value={customWater}
                onChange={(e) => setCustomWater(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddWater(customWater);
                    setCustomWater("");
                  }
                }}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#fff",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  handleAddWater(customWater);
                  setCustomWater("");
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
              <button
                type="button"
                title="Reset today's water"
                onClick={handleResetWater}
                style={{
                  padding: "6px 8px",
                  fontSize: "11px",
                  borderRadius: "6px",
                  background: "#334155",
                  color: "#94a3b8",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Nutrient Deficit & Surplus Breakdown */}
      <NutrientBalance key={refreshKey} />
    </div>
  );
}
