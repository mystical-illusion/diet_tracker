import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#00d2ff", "#3498db", "#f1c40f"];

export default function MacroPieChart({ protein, carbs, fat }) {
  const data = [
    { name: "Protein", value: protein || 0 },
    { name: "Carbs", value: carbs || 0 },
    { name: "Fat", value: fat || 0 },
  ];

  const total = protein + carbs + fat || 1;

  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
        🥧 Macro Distribution
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${value}g`, ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 12, color: "var(--text)" }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
