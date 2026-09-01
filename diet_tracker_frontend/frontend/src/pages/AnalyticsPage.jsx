import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ComposedChart,
} from "recharts";
import WeeklyComparison from "../components/WeeklyComparison";

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "15D", days: 15 },
  { label: "30D", days: 30 },
];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { goal, fetchGoal } = useGoalStore();
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);

  // Base API URL fallback
  const API_BASE = "http://127.0.0.1:5001";

  useEffect(() => {
    fetchGoal();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadData();
      setInsights(""); // Reset insights when range changes
    }
  }, [range, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/analytics/range?user_id=${user.id}&days=${range}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch range data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/analytics/ai-insights?user_id=${user.id}&days=${range}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      setInsights(result.insights);
    } catch (err) {
      setInsights("Unable to generate AI insights at this time.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const calorieGoal = goal?.daily_goal || data?.stats?.daily_goal || 2000;

  // Prepare meal type radar data
  const radarData =
    data?.meal_types?.map((mt) => ({
      type:
        (mt.meal_type || "general").charAt(0).toUpperCase() +
        (mt.meal_type || "general").slice(1),
      calories: Number(mt.total_calories || 0),
    })) || [];

  // Prepare hydration vs calories chart (Safely aligning by full_date or date)
  const hydrationChartData =
    data?.daily?.map((day, idx) => {
      const hydEntry = data.hydration ? data.hydration[idx] : null;
      return {
        date: day.date, // Already formatted as MM-DD (e.g. "08-31")
        calories: day.total_calories || 0,
        water: hydEntry ? hydEntry.water : 0,
      };
    }) || [];

  const streakColor =
    (data?.stats?.streak || 0) > 7
      ? "var(--cyan, #00d2ff)"
      : (data?.stats?.streak || 0) > 3
        ? "#f1c40f"
        : "#e74c3c";

  return (
    <div className="page">
      {/* Header */}
      <div className="row-between mb-4">
        <div>
          <div className="section-title">📊 Analytics Dashboard</div>
          <p className="section-sub">
            Deep insights into your nutrition journey
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="filter-tabs">
          {TIME_RANGES.map((r) => (
            <button
              key={r.days}
              className={`filter-tab ${range === r.days ? "active" : ""}`}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)" }}>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="stat-row mb-4">
            <div className="stat-cell">
              <div className="stat-label">Days Tracked</div>
              <div className="stat-value">{data?.stats?.days_tracked || 0}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Avg Daily Calories</div>
              <div className="stat-value">{data?.stats?.avg_calories || 0}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">🔥 Current Streak</div>
              <div className="stat-value" style={{ color: streakColor }}>
                {data?.stats?.streak || 0} days
              </div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Target Hit Rate</div>
              <div
                className="stat-value"
                style={{ color: "var(--cyan, #00d2ff)" }}
              >
                {data?.stats?.target_hit_rate || 0}%
              </div>
            </div>
          </div>

          {/* Calorie Trend Chart */}
          <div className="card mb-4">
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
              📈 Calorie Trend ({range} Days)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2, #0f172a)",
                    border: "1px solid var(--border, #334155)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val) => [`${val} kcal`, "Calories"]}
                />
                <ReferenceLine
                  y={calorieGoal}
                  stroke="var(--cyan, #00d2ff)"
                  strokeDasharray="5 5"
                  label={{
                    value: `Goal (${calorieGoal})`,
                    fill: "var(--cyan, #00d2ff)",
                    fontSize: 10,
                    position: "top",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_calories"
                  name="Calories"
                  stroke="var(--cyan, #00d2ff)"
                  strokeWidth={2}
                  dot={{ fill: "var(--cyan, #00d2ff)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Two Column Grid: Meal Radar & Goal Bar Chart */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Meal Type Radar */}
            <div className="card">
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
                🍽️ Meal Type Distribution
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="type"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  />
                  <Radar
                    dataKey="calories"
                    stroke="var(--cyan, #00d2ff)"
                    fill="var(--cyan, #00d2ff)"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-2, #0f172a)",
                      border: "1px solid var(--border, #334155)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(val) => [`${val} kcal`, "Intake"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Goal Adherence Bars */}
            <div className="card">
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
                🎯 Goal Adherence
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-2, #0f172a)",
                      border: "1px solid var(--border, #334155)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(val) => [`${val} kcal`, "Total Calories"]}
                  />
                  <ReferenceLine
                    y={calorieGoal}
                    stroke="var(--cyan, #00d2ff)"
                    strokeDasharray="5 5"
                  />
                  <Bar
                    dataKey="total_calories"
                    name="Calories"
                    radius={[4, 4, 0, 0]}
                    fill="var(--cyan, #00d2ff)"
                    maxBarSize={range > 15 ? 14 : 28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hydration vs Calories */}
          <div className="card mb-4">
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
              💧 Hydration vs Calories Correlation
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={hydrationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                />
                <YAxis
                  yAxisId="cal"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                />
                <YAxis
                  yAxisId="water"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2, #0f172a)",
                    border: "1px solid var(--border, #334155)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconSize={8}
                  formatter={(v) => (
                    <span style={{ fontSize: 12, color: "var(--text)" }}>
                      {v}
                    </span>
                  )}
                />
                <Bar
                  yAxisId="cal"
                  dataKey="calories"
                  name="Calories (kcal)"
                  fill="var(--cyan, #00d2ff)"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={range > 15 ? 14 : 28}
                />
                <Line
                  yAxisId="water"
                  type="monotone"
                  dataKey="water"
                  name="Water (ml)"
                  stroke="#3498db"
                  strokeWidth={2}
                  dot={{ fill: "#3498db", r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Automated Rule Suggestions */}
          {data?.suggestions && data.suggestions.length > 0 && (
            <div className="card mb-4">
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                💡 Rule-Based Recommendations
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 6,
                      background: "var(--surface-2, #0f172a)",
                      borderLeft: `3px solid ${s.type === "warning" ? "#f39c12" : s.type === "info" ? "#3498db" : "#2ecc71"}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {s.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Comparison */}
          <div className="mb-4">
            <WeeklyComparison />
          </div>

          {/* Gemini AI Pattern Insights */}
          <div className="card">
            <div className="row-between mb-3">
              <div className="row gap-2">
                <span style={{ fontSize: 20 }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    AI Pattern Insights
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Powered by Gemini AI
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={loadInsights}
                disabled={loadingInsights}
              >
                {loadingInsights ? "Analyzing..." : "✨ Get Insights"}
              </button>
            </div>

            {insights ? (
              <div
                style={{
                  background: "var(--surface-2, #0f172a)",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {insights}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Click "Get Insights" for AI analysis of your nutrition patterns!
                🧠
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
