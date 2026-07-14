import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { useLogStore } from "../store/logStore";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const FILTERS = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];

export default function FoodLogPage() {
  const { user } = useAuthStore();
  const { totals, date, setDate, fetchLogs } = useLogStore();
  const { goal, fetchGoal } = useGoalStore();

  const [filter, setFilter] = useState("All");
  const [food, setFood] = useState("");
  const [calories, setCalories] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [meals, setMeals] = useState([]);

  const isToday = date === format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (date) {
      fetchLogs(date);
      fetchGoal();
      loadMeals();
    }
  }, [date]);

  const loadMeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/logs/daily?user_id=${user?.id}&date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setMeals(data.meals || []);
    } catch {}
  };

  const changeDate = (delta) => {
    if (!date) return;
    const d = format(
      delta > 0 ? addDays(new Date(date), 1) : subDays(new Date(date), 1),
      "yyyy-MM-dd",
    );
    setDate(d);
  };

  const handleAdd = async () => {
    if (!food || !calories) return;
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5001/food/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          food: food,
          calories: parseInt(calories),
        }),
      });
      const data = await response.json();
      alert(data.message);
      setFood("");
      setCalories("");
      setShowForm(false);
      loadMeals();
    } catch (err) {
      alert("Failed to add meal");
    }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://127.0.0.1:5001/food/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMeals();
    } catch {}
  };

  const renderDisplayDate = () => {
    if (!date) return format(new Date(), "MMM d, yyyy");
    const parsedDate = new Date(date + "T00:00");
    return isNaN(parsedDate.getTime())
      ? format(new Date(), "MMM d, yyyy")
      : format(parsedDate, "MMM d, yyyy");
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="row-between mb-4">
        <div>
          <div className="section-title">📋 Your Food Records</div>
          <p className="section-sub">Track your daily meals and calories</p>
        </div>
        <div className="row gap-2">
          <div className="filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stat-row mb-4">
        <div className="stat-cell">
          <div className="stat-label">Logged Items</div>
          <div className="stat-value stat-value--white">{meals.length}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Total Calories</div>
          <div className="stat-value">
            {meals.reduce((sum, m) => sum + m.calories, 0)}
            <span style={{ fontSize: 13 }}>kcal</span>
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Goal</div>
          <div className="stat-value">
            {goal?.daily_goal || 2000}
            <span style={{ fontSize: 13 }}>kcal</span>
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">
            {(goal?.daily_goal || 2000) -
              meals.reduce((sum, m) => sum + m.calories, 0)}
            <span style={{ fontSize: 13 }}>kcal</span>
          </div>
        </div>
      </div>

      {/* Date nav + Add button */}
      <div className="row-between mb-4">
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => changeDate(-1)}>
            ←
          </button>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {renderDisplayDate()}
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => changeDate(1)}
            disabled={isToday}
          >
            →
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? "Cancel" : "+ Log food"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-4">
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
            Log a Food
          </p>
          <div className="col gap-3">
            <div className="field">
              <label className="label">Food name</label>
              <input
                type="text"
                className="input"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                placeholder="e.g. banana, chicken rice..."
              />
            </div>
            <div className="field">
              <label className="label">Calories</label>
              <input
                type="number"
                className="input"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 89"
                min="1"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!food || !calories || adding}
              className="btn btn-solid btn-full"
            >
              {adding ? "Logging…" : "Log food"}
            </button>
          </div>
        </div>
      )}

      {/* Meals list */}
      {meals.length === 0 && !showForm ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">〜</div>
            <div className="empty-state-title">No food logs found</div>
            <div className="empty-state-sub">
              Click "+ Log food" to add your first meal!
            </div>
          </div>
        </div>
      ) : (
        <div className="col gap-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{meal.food}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {meal.date}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "var(--cyan)", fontWeight: 600 }}>
                  {meal.calories} kcal
                </span>
                <button
                  onClick={() => handleDelete(meal.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "red",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
