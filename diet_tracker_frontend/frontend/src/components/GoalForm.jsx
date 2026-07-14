import { useState } from "react";

export default function GoalForm({ initialGoals, onSave }) {
  const [goals, setGoals] = useState({
    daily_goal: initialGoals?.daily_goal || 2000,
  });

  const handleChange = (e) => {
    setGoals({
      ...goals,
      [e.target.name]: Number(e.target.value),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(goals);
  };

  return (
    <form onSubmit={handleSubmit} className="goal-form">
      <div className="field">
        <label className="label">Daily Calorie Target (kcal)</label>
        <input
          type="number"
          name="daily_goal"
          className="input"
          value={goals.daily_goal}
          onChange={handleChange}
          min="500"
          max="10000"
          required
        />
      </div>

      {/* Calculated macros based on calories */}
      <div
        className="card mt-3"
        style={{
          background: "var(--surface-2)",
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          Recommended Macros (Auto-calculated)
        </div>
        <div className="col gap-2" style={{ color: "var(--text-muted)" }}>
          <div className="row-between">
            <span>Protein (30%)</span>
            <span style={{ color: "var(--cyan)" }}>
              ~{Math.round((goals.daily_goal * 0.3) / 4)}g
            </span>
          </div>
          <div className="row-between">
            <span>Carbohydrates (45%)</span>
            <span style={{ color: "var(--cyan)" }}>
              ~{Math.round((goals.daily_goal * 0.45) / 4)}g
            </span>
          </div>
          <div className="row-between">
            <span>Fat (25%)</span>
            <span style={{ color: "var(--cyan)" }}>
              ~{Math.round((goals.daily_goal * 0.25) / 9)}g
            </span>
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full mt-3">
        Save Goal
      </button>
    </form>
  );
}
