import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little/no exercise" },
  { value: "light", label: "Light", desc: "1-3 days/week" },
  { value: "moderate", label: "Moderate", desc: "3-5 days/week" },
  { value: "heavy", label: "Heavy", desc: "6-7 days/week" },
];

const GOAL_PRESETS = [
  { type: "fat_loss", label: "🔥 Fat Loss", color: "#e74c3c" },
  { type: "maintenance", label: "⚖️ Maintain", color: "#00d2ff" },
  { type: "muscle_gain", label: "💪 Muscle Gain", color: "#2ecc71" },
];

export default function NutritionPage() {
  const { user } = useAuthStore();
  const { goal, fetchGoal } = useGoalStore();

  // Personal stats
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [conditions, setConditions] = useState("");

  // Goals
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [goalType, setGoalType] = useState("maintenance");
  const [proteinPct, setProteinPct] = useState(30);
  const [carbsPct, setCarbsPct] = useState(45);
  const [fatPct, setFatPct] = useState(25);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [exerciseMins, setExerciseMins] = useState(30);

  // TDEE & AI state
  const [tdeeData, setTdeeData] = useState(null);
  const [aiRecText, setAiRecText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE = "http://127.0.0.1:5001";

  useEffect(() => {
    fetchGoal();
  }, []);

  useEffect(() => {
    if (goal) {
      setDailyGoal(goal.daily_goal || 2000);
      setGoalType(goal.goal_type || "maintenance");
      setProteinPct(goal.protein_pct ?? 30);
      setCarbsPct(goal.carbs_pct ?? 45);
      setFatPct(goal.fat_pct ?? 25);
      setWaterGoal(goal.water_goal || 2000);
      setExerciseMins(goal.exercise_mins_daily || 30);
      setAge(goal.age || "");
      setGender(goal.gender || "male");
      setHeight(goal.height_cm || "");
      setWeight(goal.weight_kg || "");
      setActivity(goal.activity_level || "moderate");
      setConditions(goal.health_conditions || "");
    }
  }, [goal]);

  // Calculated macros
  const proteinG = Math.round((dailyGoal * proteinPct) / 100 / 4);
  const carbsG = Math.round((dailyGoal * carbsPct) / 100 / 4);
  const fatG = Math.round((dailyGoal * fatPct) / 100 / 9);
  const totalPct = proteinPct + carbsPct + fatPct;

  // Calculate TDEE
  const calculateTDEE = async () => {
    if (!age || !height || !weight) {
      alert("Please fill in age, height, and weight!");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/goals/calculate-tdee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: parseInt(age, 10),
          gender,
          height_cm: parseFloat(height),
          weight_kg: parseFloat(weight),
          activity_level: activity,
        }),
      });
      const data = await response.json();
      setTdeeData(data);
    } catch (err) {
      console.error("TDEE Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply preset
  const applyPreset = (type) => {
    if (!tdeeData?.presets) {
      alert("Calculate TDEE first!");
      return;
    }
    setGoalType(type);
    setDailyGoal(tdeeData.presets[type]);
  };

  // Get AI Recommendation & Auto-Fill Form
  const getAIRecommendation = async () => {
    if (!age || !height || !weight) {
      alert("Please provide age, height, and weight for an accurate AI plan.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/goals/ai-recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          age: parseInt(age, 10),
          gender,
          height_cm: parseFloat(height),
          weight_kg: parseFloat(weight),
          activity_level: activity,
          health_conditions: conditions,
          goal_type: goalType,
          daily_goal: dailyGoal,
        }),
      });
      const data = await response.json();

      // If backend returned JSON targets, auto-fill the controls
      if (data.daily_goal) setDailyGoal(data.daily_goal);
      if (data.protein_pct) setProteinPct(data.protein_pct);
      if (data.carbs_pct) setCarbsPct(data.carbs_pct);
      if (data.fat_pct) setFatPct(data.fat_pct);
      if (data.water_goal) setWaterGoal(data.water_goal);
      if (data.exercise_mins_daily) setExerciseMins(data.exercise_mins_daily);

      setAiRecText(
        data.rationale ||
          data.recommendation ||
          "AI plan configured and applied to targets.",
      );
    } catch (err) {
      console.error("AI Smart Target Error:", err);
      setAiRecText("Unable to retrieve AI recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Save goals
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/goals/${user?.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          daily_goal: dailyGoal,
          goal_type: goalType,
          age: parseInt(age, 10) || null,
          gender,
          height_cm: parseFloat(height) || null,
          weight_kg: parseFloat(weight) || null,
          activity_level: activity,
          protein_pct: proteinPct,
          carbs_pct: carbsPct,
          fat_pct: fatPct,
          water_goal: waterGoal,
          exercise_mins_daily: exerciseMins,
          exercise_mins_weekly: exerciseMins * 7,
          health_conditions: conditions,
        }),
      });

      if (response.ok) {
        setMessage("✅ Goals saved successfully!");
        fetchGoal();
      } else {
        setMessage("❌ Server rejected goal update");
      }
    } catch (err) {
      setMessage("❌ Failed to connect to server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="section-header mb-4">
        <div className="section-title">◎ Nutritional Goals</div>
        <p className="section-sub">
          Set personalized targets for your health journey
        </p>
      </div>

      {/* Personal Stats */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          👤 Personal Stats
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div className="field">
            <label className="label">Age</label>
            <input
              type="number"
              className="input"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 22"
            />
          </div>
          <div className="field">
            <label className="label">Gender</label>
            <select
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Height (cm)</label>
            <input
              type="number"
              className="input"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 165"
            />
          </div>
          <div className="field">
            <label className="label">Weight (kg)</label>
            <input
              type="number"
              className="input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 60"
            />
          </div>
        </div>

        {/* Activity Level */}
        <div className="field mt-3">
          <label className="label">Activity Level</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 8,
            }}
          >
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setActivity(a.value)}
                style={{
                  padding: "8px 4px",
                  borderRadius: 8,
                  border: `1px solid ${activity === a.value ? "var(--cyan)" : "var(--border)"}`,
                  background:
                    activity === a.value
                      ? "var(--cyan-tint)"
                      : "var(--surface-2)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: activity === a.value ? "var(--cyan)" : "var(--text)",
                  }}
                >
                  {a.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {a.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calculate TDEE */}
        <button
          type="button"
          className="btn btn-primary btn-full mt-3"
          onClick={calculateTDEE}
          disabled={loading}
        >
          {loading ? "Calculating..." : "⚡ Calculate TDEE & BMI"}
        </button>

        {/* TDEE Results */}
        {tdeeData && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "var(--surface-2)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--cyan)",
                  }}
                >
                  {tdeeData.tdee}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  TDEE (kcal)
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--cyan)",
                  }}
                >
                  {tdeeData.bmi}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  BMI
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--cyan)",
                    marginTop: 4,
                  }}
                >
                  {tdeeData.bmi_category}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Category
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Quick presets:
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
              }}
            >
              {GOAL_PRESETS.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => applyPreset(p.type)}
                  style={{
                    padding: "8px 4px",
                    borderRadius: 8,
                    border: `1px solid ${goalType === p.type ? p.color : "var(--border)"}`,
                    background:
                      goalType === p.type ? `${p.color}22` : "transparent",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: goalType === p.type ? p.color : "var(--text)",
                    }}
                  >
                    {p.label}
                  </div>
                  <div style={{ fontSize: 11, color: p.color, marginTop: 2 }}>
                    {tdeeData.presets[p.type]} kcal
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calorie Goal */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          🎯 Daily Calorie Goal
        </p>
        <div className="field">
          <label className="label">Target Calories (kcal)</label>
          <input
            type="number"
            className="input"
            value={dailyGoal || ""}
            onChange={(e) => setDailyGoal(Number(e.target.value) || 0)}
            min="500"
            max="10000"
          />
        </div>
      </div>

      {/* Macro Split */}
      <div className="card mb-4">
        <div className="row-between mb-3">
          <p style={{ fontWeight: 600, fontSize: 14 }}>
            🥩 Macronutrient Split
          </p>
          <span
            style={{
              fontSize: 12,
              color: totalPct === 100 ? "var(--cyan)" : "#f87171",
              fontWeight: 600,
            }}
          >
            Total: {totalPct}% {totalPct !== 100 && " ⚠️ must = 100%"}
          </span>
        </div>

        {/* Sliders */}
        <div className="field">
          <div className="row-between">
            <label className="label">🥩 Protein {proteinPct}%</label>
            <span
              style={{ fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}
            >
              {proteinG}g
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            value={proteinPct}
            onChange={(e) => setProteinPct(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--cyan)" }}
          />
        </div>

        <div className="field">
          <div className="row-between">
            <label className="label">🌾 Carbs {carbsPct}%</label>
            <span style={{ fontSize: 13, color: "#3498db", fontWeight: 600 }}>
              {carbsG}g
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="70"
            value={carbsPct}
            onChange={(e) => setCarbsPct(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3498db" }}
          />
        </div>

        <div className="field">
          <div className="row-between">
            <label className="label">🥑 Fat {fatPct}%</label>
            <span style={{ fontSize: 13, color: "#f1c40f", fontWeight: 600 }}>
              {fatG}g
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            value={fatPct}
            onChange={(e) => setFatPct(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f1c40f" }}
          />
        </div>

        {/* Visual Ratio Bar */}
        <div
          style={{
            display: "flex",
            height: 12,
            borderRadius: 6,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div style={{ width: `${proteinPct}%`, background: "var(--cyan)" }} />
          <div style={{ width: `${carbsPct}%`, background: "#3498db" }} />
          <div style={{ width: `${fatPct}%`, background: "#f1c40f" }} />
        </div>
      </div>

      {/* Hydration & Exercise */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          💧 Hydration & Exercise Targets
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div className="field">
            <label className="label">Daily Water Goal (ml)</label>
            <input
              type="number"
              className="input"
              value={waterGoal || ""}
              onChange={(e) => setWaterGoal(Number(e.target.value) || 0)}
              min="500"
              max="5000"
              step="250"
            />
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
            >
              ≈ {Math.round(waterGoal / 250)} glasses/day
            </div>
          </div>
          <div className="field">
            <label className="label">Exercise (mins/day)</label>
            <input
              type="number"
              className="input"
              value={exerciseMins || ""}
              onChange={(e) => setExerciseMins(Number(e.target.value) || 0)}
              min="0"
              max="240"
            />
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
            >
              {exerciseMins * 7} mins/week
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[1500, 2000, 2500, 3000].map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => setWaterGoal(ml)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                border: `1px solid ${waterGoal === ml ? "var(--cyan)" : "var(--border)"}`,
                background:
                  waterGoal === ml ? "var(--cyan-tint)" : "transparent",
                fontSize: 12,
                cursor: "pointer",
                color: waterGoal === ml ? "var(--cyan)" : "var(--text)",
              }}
            >
              {ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Health Conditions */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
          🏥 Health Conditions (Optional)
        </p>
        <textarea
          className="input"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="e.g. diabetes, acid reflux, lactose intolerant..."
          rows={2}
          style={{ resize: "none" }}
        />
      </div>

      {/* AI Smart Target */}
      <div className="card mb-4">
        <div className="row-between mb-3">
          <div className="row gap-2">
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                AI Smart Target
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Personalized by Gemini AI
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={getAIRecommendation}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "✨ Get Smart Target"}
          </button>
        </div>

        {aiRecText ? (
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 8,
              padding: 14,
              fontSize: 13,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {aiRecText}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: 16,
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            Fill in your stats above and click "Get Smart Target" to compute
            automated calorie and macro goals. 🎯
          </div>
        )}
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          style={{
            padding: "10px 14px",
            background: message.startsWith("✅")
              ? "var(--cyan-tint)"
              : "rgba(231, 76, 60, 0.1)",
            borderRadius: 8,
            fontSize: 13,
            color: message.startsWith("✅") ? "var(--cyan)" : "#f87171",
            marginBottom: 12,
          }}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary btn-full"
        onClick={handleSave}
        disabled={saving || totalPct !== 100}
      >
        {saving ? "Saving..." : "💾 Save All Goals"}
      </button>

      {totalPct !== 100 && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#f87171",
            marginTop: 8,
          }}
        >
          ⚠️ Macro percentages must add up to 100%
        </p>
      )}
    </div>
  );
}
