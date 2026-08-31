import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function WeeklyComparison() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/analytics/weekly-comparison?user_id=${user?.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const result = await response.json();
      setData(result);
    } catch {}
    setLoading(false);
  };

  if (loading)
    return (
      <div className="card">
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Loading comparison...
        </p>
      </div>
    );

  if (!data) return null;

  const { this_week, last_week, comparison } = data;

  // merge data for chart
  const chartData = this_week.data.map((day, i) => ({
    date: day.date.slice(5),
    "This Week": day.total_calories,
    "Last Week": last_week.data[i]?.total_calories || 0,
  }));

  const trendColor =
    comparison.trend === "improving"
      ? "green"
      : comparison.trend === "declining"
        ? "red"
        : "var(--cyan)";

  const trendEmoji =
    comparison.trend === "improving"
      ? "📉"
      : comparison.trend === "declining"
        ? "📈"
        : "➡️";

  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
        📊 Weekly Comparison
      </p>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* This Week */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: 8,
            padding: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            This Week Avg
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cyan)",
            }}
          >
            {this_week.stats.avg_calories}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            kcal/day
          </div>
        </div>

        {/* Trend */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: 8,
            padding: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            Trend
          </div>
          <div style={{ fontSize: 24 }}>{trendEmoji}</div>
          <div
            style={{
              fontSize: 11,
              color: trendColor,
              fontWeight: 600,
            }}
          >
            {comparison.change_percentage > 0 ? "+" : ""}
            {comparison.change_percentage}%
          </div>
        </div>

        {/* Last Week */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: 8,
            padding: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            Last Week Avg
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-muted)",
            }}
          >
            {last_week.stats.avg_calories}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            kcal/day
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              iconSize={8}
              formatter={(value) => (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text)",
                  }}
                >
                  {value}
                </span>
              )}
            />
            <ReferenceLine
              y={comparison.daily_goal}
              stroke="var(--cyan)"
              strokeDasharray="5 5"
              label={{
                value: "Goal",
                fill: "var(--cyan)",
                fontSize: 10,
              }}
            />
            <Bar dataKey="This Week" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Last Week"
              fill="var(--text-muted)"
              radius={[4, 4, 0, 0]}
              opacity={0.5}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
            padding: 20,
          }}
        >
          Not enough data for comparison yet! Keep logging meals! 🥗
        </div>
      )}

      {/* Goal Achievement */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "var(--surface-2)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          🎯 Goal Achievement
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>This week</span>
          <span style={{ color: "var(--cyan)", fontWeight: 600 }}>
            {this_week.stats.goal_achieved_days} /{" "}
            {this_week.stats.days_tracked} days ✅
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Last week</span>
          <span
            style={{
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {last_week.stats.goal_achieved_days} /{" "}
            {last_week.stats.days_tracked} days
          </span>
        </div>
      </div>
    </div>
  );
}
