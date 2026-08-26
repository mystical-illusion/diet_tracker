import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function CalorieLineChart({ data, goal }) {
  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
        📈 Daily Calorie Trend
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickFormatter={(date) => date.slice(5)}
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
          {/* goal line */}
          <ReferenceLine
            y={goal}
            stroke="var(--cyan)"
            strokeDasharray="5 5"
            label={{
              value: "Goal",
              fill: "var(--cyan)",
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="var(--cyan)"
            strokeWidth={2}
            dot={{ fill: "var(--cyan)", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
