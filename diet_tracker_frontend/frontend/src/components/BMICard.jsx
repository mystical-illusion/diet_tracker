import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function BMICard() {
  const user = useAuthStore((state) => state.user);
  const [metrics, setMetrics] = useState({
    height_cm: 165,
    weight_kg: 65,
    age: 25,
    gender: "female",
  });
  const [bmiData, setBmiData] = useState({
    bmi: 23.9,
    category: "Normal weight",
    color: "#4ade80",
  });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/user/${user.id}`);
      if (res.data?.user) {
        setMetrics({
          height_cm: res.data.user.height_cm || 165,
          weight_kg: res.data.user.weight_kg || 65,
          age: res.data.user.age || 25,
          gender: res.data.user.gender || "female",
        });
        setBmiData({
          bmi: res.data.bmi,
          category: res.data.bmi_category,
          color: res.data.bmi_color,
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/user/${user.id}`, metrics);

      const heightM = Number(metrics.height_cm) / 100;
      const calculatedBmi = (
        Number(metrics.weight_kg) /
        (heightM * heightM)
      ).toFixed(1);

      setBmiData({
        bmi: res.data?.bmi || calculatedBmi,
        category:
          res.data?.bmi_category ||
          (calculatedBmi >= 25
            ? "Overweight"
            : calculatedBmi < 18.5
              ? "Underweight"
              : "Normal weight"),
        color:
          res.data?.bmi_color ||
          (calculatedBmi >= 25
            ? "#facc15"
            : calculatedBmi < 18.5
              ? "#38bdf8"
              : "#4ade80"),
      });

      setEditing(false);
      setMsg("Metrics updated successfully!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update health metrics");
    }
  };

  return (
    <div
      className="card"
      style={{
        background: "var(--surface-1, #1e293b)",
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #334155",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: "14px",
            margin: 0,
            color: "#fff",
          }}
        >
          ⚖️ Body Mass Index (BMI)
        </p>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          style={{
            background: "none",
            border: "none",
            color: "var(--cyan, #00d2ff)",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {editing ? "Cancel" : "Edit Metrics"}
        </button>
      </div>

      {msg && (
        <div
          style={{ fontSize: "12px", color: "#4ade80", marginBottom: "8px" }}
        >
          {msg}
        </div>
      )}

      {!editing ? (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: bmiData.color,
              }}
            >
              {bmiData.bmi}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: bmiData.color,
                background: "#0f172a",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {bmiData.category}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--text-muted, #94a3b8)",
            }}
          >
            <div>
              Age: <strong style={{ color: "#fff" }}>{metrics.age} yrs</strong>
            </div>
            <div>
              Height:{" "}
              <strong style={{ color: "#fff" }}>{metrics.height_cm} cm</strong>
            </div>
            <div>
              Weight:{" "}
              <strong style={{ color: "#fff" }}>{metrics.weight_kg} kg</strong>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleUpdate}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}
          >
            {/* Age Input */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Age
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={metrics.age}
                onChange={(e) =>
                  setMetrics({ ...metrics, age: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "4px",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Height Input */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Height (cm)
              </label>
              <input
                type="number"
                value={metrics.height_cm}
                onChange={(e) =>
                  setMetrics({ ...metrics, height_cm: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "4px",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Weight Input */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={metrics.weight_kg}
                onChange={(e) =>
                  setMetrics({ ...metrics, weight_kg: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "4px",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "4px",
              padding: "7px 12px",
              background: "var(--cyan, #00d2ff)",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Save Metrics
          </button>
        </form>
      )}
    </div>
  );
}
