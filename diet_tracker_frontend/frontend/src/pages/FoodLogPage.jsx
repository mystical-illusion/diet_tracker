import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";

const MEAL_CATEGORIES = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];

export default function FoodLogPage() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState("2026-09-01");
  const [activeCategory, setActiveCategory] = useState("All");
  const [logData, setLogData] = useState({
    meals: [],
    total_calories: 0,
    goal_target: 1800,
    remaining: 1800,
  });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/logs/daily?user_id=${user.id}&date=${selectedDate}`,
      );
      if (res.ok) {
        const data = await res.json();
        setLogData(data);
      }
    } catch (err) {
      console.error("Failed to load food records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user?.id, selectedDate]);

  // Handle Deleting an item
  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/logs/${mealId}?user_id=${user.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        fetchLogs(); // Refresh lists and calorie counters
      }
    } catch (err) {
      console.error("Failed to delete meal:", err);
    }
  };

  // Filter list by category
  const filteredMeals = logData.meals.filter((item) => {
    if (activeCategory === "All") return true;
    return (
      (item.meal_type || "snack").toLowerCase() === activeCategory.toLowerCase()
    );
  });

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1000px",
        margin: "0 auto",
        color: "#fff",
      }}
    >
      {/* Top Header & Category Filter Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
            📂 Your Food Records
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Track your daily meals, calories, and nutritional macros
          </p>
        </div>

        {/* Categories Tab */}
        <div style={{ display: "flex", gap: "6px" }}>
          {MEAL_CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid #334155",
                  background: active ? "var(--cyan, #00d2ff)" : "#0f172a",
                  color: active ? "#000" : "#94a3b8",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          background: "#1e293b",
          padding: "16px",
          borderRadius: "10px",
          border: "1px solid #334155",
          marginBottom: "20px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            LOGGED ITEMS
          </span>
          <div
            style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}
          >
            {filteredMeals.length}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            TOTAL CALORIES
          </span>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginTop: "4px",
              color: "#00d2ff",
            }}
          >
            {logData.total_calories} kcal
          </div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            GOAL TARGET
          </span>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginTop: "4px",
              color: "#38bdf8",
            }}
          >
            {logData.goal_target} kcal
          </div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>REMAINING</span>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginTop: "4px",
              color: "#4ade80",
            }}
          >
            {logData.remaining} kcal
          </div>
        </div>
      </div>

      {/* Date Selector & Action */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <button
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600 }}
        >
          + Log Food
        </button>
      </div>

      {/* Itemized Food List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
          Loading records...
        </div>
      ) : filteredMeals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "#1e293b",
            borderRadius: "10px",
            color: "#94a3b8",
            border: "1px solid #334155",
          }}
        >
          No food logs found for this filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredMeals.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#1e293b",
                padding: "14px 18px",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <div>
                <div
                  style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}
                >
                  {item.food}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  <span
                    style={{ color: "#38bdf8", textTransform: "capitalize" }}
                  >
                    {item.meal_type || "Meal"}
                  </span>{" "}
                  • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                </div>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#38bdf8",
                  }}
                >
                  {item.calories} kcal
                </span>
                <button
                  onClick={() => handleDeleteMeal(item.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                  title="Delete Record"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
