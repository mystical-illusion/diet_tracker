import { useEffect, useState } from "react";
import { useGoalStore } from "../store/goalStore";
import { useAuthStore } from "../store/authStore";

export default function NutritionPage() {
  const { user } = useAuthStore();
  const { goal, fetchGoal, saveGoal } = useGoalStore();
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchGoal();
  }, []);

  useEffect(() => {
    if (goal) setDailyGoal(goal.daily_goal);
  }, [goal]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveGoal(dailyGoal);
      setMessage("Goal saved successfully!");
      fetchGoal();
    } catch {
      setMessage("Failed to save goal");
    }
    setSaving(false);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">◎ Nutritional Goals</div>
        <p className="section-sub">Set your daily calorie target</p>
      </div>

      {/* Current Goal */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          Current Goal
        </p>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--cyan)",
            textAlign: "center",
          }}
        >
          {goal?.daily_goal || 2000} kcal
        </div>
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          Daily calorie target
        </div>
      </div>

      {/* Set Goal Form */}
      <div className="card">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          Update Goal
        </p>
        <form onSubmit={handleSave} className="col gap-3">
          <div className="field">
            <label className="label">Daily Calories Target (kcal)</label>
            <input
              type="number"
              className="input"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value))}
              required
              min="500"
              max="10000"
            />
          </div>

          {message && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--cyan-tint)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--cyan)",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-full"
          >
            {saving ? "Saving…" : "Save Goal"}
          </button>
        </form>
      </div>

      {/* Nutrition Info */}
      <div className="card mt-4" style={{ background: "var(--surface-2)" }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
          Recommended Daily Values
        </div>
        <div
          className="col gap-2"
          style={{ fontSize: 13, color: "var(--text-muted)" }}
        >
          <div className="row-between">
            <span>Protein</span>
            <span style={{ color: "var(--cyan)" }}>
              ~{Math.round((dailyGoal * 0.3) / 4)}g (30%)
            </span>
          </div>
          <div className="row-between">
            <span>Carbohydrates</span>
            <span style={{ color: "var(--cyan)" }}>
              ~{Math.round((dailyGoal * 0.45) / 4)}g (45%)
            </span>
          </div>
          <div className="row-between">
            <span>Fat</span>
            <span style={{ color: "var(--cyan)" }}>
              ~{Math.round((dailyGoal * 0.25) / 9)}g (25%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
