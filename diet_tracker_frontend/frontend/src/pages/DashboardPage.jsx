import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import api from "../services/api";
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

  const userId = user?.id;

  // 1. Dynamic Water Target Goal (Persisted in localStorage, defaults to 2500 ml)
  const [waterGoal, setWaterGoal] = useState(() => {
    return parseInt(localStorage.getItem("water_goal") || "2500", 10);
  });

  // 2. Daily Water Intake (Persisted per date)
  const [water, setWater] = useState(() => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("water_today") || "0", 10);
  });

  // Custom water amount and target edit state
  const [customWater, setCustomWater] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(waterGoal.toString());

  // Persist daily water intake
  useEffect(() => {
    localStorage.setItem("water_today", water.toString());
  }, [water]);

  // Persist custom water target goal
  useEffect(() => {
    localStorage.setItem("water_goal", waterGoal.toString());
  }, [waterGoal]);

  // Sync date change and reset water if necessary
  const loadWater = useCallback(() => {
    const savedDate = localStorage.getItem("water_date");
    if (savedDate !== today) {
      localStorage.setItem("water_date", today);
      localStorage.setItem("water_today", "0");
      setWater(0);
    } else {
      setWater(parseInt(localStorage.getItem("water_today") || "0", 10));
    }
  }, [today]);

  // Helper to add water
  const handleAddWater = (amount) => {
    const num = parseInt(amount, 10);
    if (!isNaN(num) && num > 0) {
      setWater((prev) => prev + num);
    }
  };

  // Helper to save target goal
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

  // 5. Stable Data Initialization Hook
  useEffect(() => {
    if (userId) {
      fetchGoal();
      loadMeals();
      loadWeeklyData();
      loadWater();
    }
  }, [userId, fetchGoal, loadMeals, loadWeeklyData, loadWater]);

  // General Dashboard Calculations
  const calorieGoal = Number(goal?.daily_goal) || 2000;
  const totalCalories = meals.reduce(
    (sum, m) => sum + (Number(m.calories) || 0),
    0,
  );

  // Dynamic Water Percentages
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
          {/* Smart Logger Card */}
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

          {/* 7-Day Chart */}
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
                    (sum, m) => sum + (Number(m.calories) || 0),
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
                              key={meal.id || meal.food}
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

          {/* AI Chatbot Widget */}
          <AIChat />
        </div>

        <div className="dash-right">
          {/* Calorie Summary */}
          <CalorieSummary
            totals={{ calories: totalCalories }}
            goal={goal || { daily_goal: 2000 }}
          />

          {/* Dynamic Hydration Station */}
          <div
            className="card"
            style={{
              background: "var(--surface-2, #15151e)",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            <div
              className="row-between mb-2"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                className="row gap-2"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "18px" }}>💧</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  Hydration Station
                </div>
              </div>

              {/* Target Goal Display / Edit Switch */}
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

            {/* Progress Bar */}
            <div
              className="hydration-bar-wrap"
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
                className="hydration-fill"
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

            {/* Dynamic Preset Increment Buttons */}
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
                    background: "var(--surface, #1e293b)",
                    color: "#00d2ff",
                    border: "1px solid #334155",
                    cursor: "pointer",
                  }}
                >
                  +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                </button>
              ))}
            </div>

            {/* Custom Amount Logger & Reset Row */}
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
                onClick={() => setWater(0)}
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
    </div>
  );
}
