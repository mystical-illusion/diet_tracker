import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function WeeklyComparison() {
  const { user } = useAuthStore();
  const [data, setData] = useState({
    this_week: [],
    last_week: [],
    this_week_total: 0,
    last_week_total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchWeeklyData();
    }
  }, [user?.id]);

  const fetchWeeklyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/analytics/weekly-comparison?user_id=${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const res = await response.json();
        setData({
          this_week: res?.this_week || [],
          last_week: res?.last_week || [],
          this_week_total: res?.this_week_total || 0,
          last_week_total: res?.last_week_total || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load weekly comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted, #94a3b8)",
        }}
      >
        Loading comparison...
      </div>
    );
  }

  // Safe mapping with empty array fallbacks
  const thisWeekMap = (data?.this_week || []).reduce((acc, curr) => {
    if (curr?.date) acc[curr.date.slice(5)] = curr.calories || 0;
    return acc;
  }, {});

  const chartData = (data?.this_week || []).map((item) => ({
    date: item?.date ? item.date.slice(5) : "",
    current: item?.calories || 0,
  }));

  const diff = (data?.this_week_total || 0) - (data?.last_week_total || 0);

  return (
    <div className="card">
      <div className="row-between mb-3">
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            📅 Week-over-Week Comparison
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)" }}>
            Current 7 Days vs. Previous 7 Days
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {diff > 0 ? (
            <span style={{ color: "#f87171" }}>
              ▲ +{diff} kcal vs last week
            </span>
          ) : diff < 0 ? (
            <span style={{ color: "#4ade80" }}>▼ {diff} kcal vs last week</span>
          ) : (
            <span style={{ color: "#94a3b8" }}>Same as last week</span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: "var(--surface-2, #0f172a)",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
            This Week's Total
          </span>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--cyan, #00d2ff)",
            }}
          >
            {data?.this_week_total || 0} kcal
          </div>
        </div>
        <div
          style={{
            background: "var(--surface-2, #0f172a)",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
            Last Week's Total
          </span>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#818cf8" }}>
            {data?.last_week_total || 0} kcal
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border, #334155)"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-muted, #94a3b8)" }}
          />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-muted, #94a3b8)" }} />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2, #0f172a)",
              border: "1px solid var(--border, #334155)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="current"
            name="Calories"
            fill="var(--cyan, #00d2ff)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
