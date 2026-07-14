import { useState } from "react";
import { useLogStore } from "../store/logStore";

const MEAL_ICONS = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
  general: "🍽️",
};

export default function MealCard({ mealType, logs = [], onRefresh }) {
  const { deleteLog } = useLogStore();
  const [editId, setEditId] = useState(null);
  const [editFood, setEditFood] = useState("");
  const [editCalories, setEditCalories] = useState("");

  // calculate total calories
  const totalCals = logs.reduce((s, l) => s + (l.calories || 0), 0);

  const handleDelete = async (id) => {
    try {
      await deleteLog(id);
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
  };

  const handleEdit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://127.0.0.1:5001/food/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          food: editFood,
          calories: parseInt(editCalories),
        }),
      });
      setEditId(null);
      onRefresh();
    } catch {
      alert("Failed to update");
    }
  };

  return (
    <div className="card">
      <div className="meal-card-header">
        <div className="meal-card-title">
          <span>{MEAL_ICONS[mealType] || "🍽️"}</span>
          <span style={{ textTransform: "capitalize" }}>{mealType}</span>
        </div>
        {totalCals > 0 && (
          <span className="meal-card-cals">{totalCals} kcal</span>
        )}
      </div>

      {logs.length === 0 ? (
        <p className="meal-empty">Nothing logged yet</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="meal-row">
            <div className="meal-row-info">
              <div className="meal-row-name">{log.food}</div>
              <div className="meal-row-meta">
                {log.calories} kcal · {log.date}
              </div>
            </div>

            {editId === log.id ? (
              <div className="row gap-1 shrink-0">
                <input
                  type="text"
                  value={editFood}
                  onChange={(e) => setEditFood(e.target.value)}
                  className="input"
                  style={{ width: 80, padding: "4px 8px", fontSize: 12 }}
                  placeholder="food"
                />
                <input
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                  className="input"
                  style={{ width: 60, padding: "4px 8px", fontSize: 12 }}
                  placeholder="kcal"
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleEdit(log.id)}
                >
                  ✓
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditId(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="meal-row-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditId(log.id);
                    setEditFood(log.food);
                    setEditCalories(log.calories);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(log.id)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
