import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function GoalProgressChart({ consumed, goal }) {
  const pct = Math.min((consumed / goal) * 100, 100);

  const data = [{ name: "Consumed", value: pct, fill: "var(--cyan)" }];

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        🎯 Goal Progress
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: "var(--surface-2)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div
        style={{
          marginTop: -20,
          fontSize: 28,
          fontWeight: 700,
          color: "var(--cyan)",
        }}
      >
        {pct.toFixed(0)}%
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 4,
        }}
      >
        {consumed} / {goal} kcal
      </div>
    </div>
  );
}
