import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function NutrientBalance() {
  const user = useAuthStore((state) => state.user);
  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNutrientStatus();
    }
  }, [user?.id]);

  const loadNutrientStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/analytics/nutrient-status?user_id=${user.id}`,
      );
      setNutrients(res.data?.nutrients || []);
    } catch (err) {
      console.error("Failed to load nutrient status:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="card"
        style={{
          background: "var(--surface-1, #1e293b)",
          padding: 16,
          borderRadius: 10,
        }}
      >
        <p
          style={{
            color: "var(--text-muted, #94a3b8)",
            fontSize: 13,
            margin: 0,
          }}
        >
          Calculating nutrient balance...
        </p>
      </div>
    );
  }

  if (!nutrients.length) return null;

  return (
    <div
      className="card"
      style={{
        background: "var(--surface-1, #1e293b)",
        padding: "16px",
        borderRadius: "10px",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 600,
              fontSize: "14px",
              margin: 0,
              color: "#fff",
            }}
          >
            ⚖️ Daily Nutrient Deficit & Surplus
          </p>
          <span
            style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}
          >
            Live status of your daily intake vs. targets
          </span>
        </div>
        <button
          onClick={loadNutrientStatus}
          style={{
            background: "none",
            border: "none",
            color: "var(--cyan, #00d2ff)",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {nutrients.map((item) => (
          <div
            key={item.nutrient}
            style={{
              background: "var(--surface-2, #0f172a)",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            {/* Header: Name and Status Badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span
                style={{ fontWeight: 600, fontSize: "13px", color: "#fff" }}
              >
                {item.nutrient}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: item.color,
                  background: "rgba(255,255,255,0.05)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: `1px solid ${item.color}40`,
                }}
              >
                {item.status}: {item.consumed} / {item.target} {item.unit}
              </span>
            </div>

            {/* Visual Bar */}
            <div
              style={{
                width: "100%",
                height: "6px",
                background: "#1e293b",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(item.percentage, 100)}%`,
                  height: "100%",
                  background: item.color,
                  borderRadius: "3px",
                  transition: "width 0.4s ease-in-out",
                }}
              />
            </div>

            {/* Footer Message */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "var(--text-muted, #94a3b8)",
                marginTop: "4px",
              }}
            >
              <span>{item.message}</span>
              <span>{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
