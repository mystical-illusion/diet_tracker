import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function WeeklyBarChart({ data, goal }) {
  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
        📊 Weekly Calories
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
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
          <ReferenceLine y={goal} stroke="var(--cyan)" strokeDasharray="5 5" />
          <Bar dataKey="calories" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
