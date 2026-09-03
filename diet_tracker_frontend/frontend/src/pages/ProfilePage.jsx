import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";

const HEALTH_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Acid Reflux",
  "Lactose Intolerant",
  "Gluten Free",
  "High Cholesterol",
  "IBS",
  "PCOS",
];

const DIETARY_PREFS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Eggetarian",
  "Keto",
  "Low-Carb",
];

const BADGES = [
  {
    id: "logger7",
    icon: "📅",
    label: "7-Day Logger",
    desc: "Log meals 7 days",
    threshold: 7,
  },
  {
    id: "logger30",
    icon: "🏆",
    label: "30-Day Logger",
    desc: "Log meals 30 days",
    threshold: 30,
  },
  {
    id: "water7",
    icon: "💧",
    label: "Water Champion",
    desc: "Hit water goal 7 days",
    threshold: 7,
  },
  {
    id: "meals50",
    icon: "🍽️",
    label: "Meal Master",
    desc: "Log 50 meals",
    threshold: 50,
  },
  {
    id: "meals100",
    icon: "⭐",
    label: "Nutrition Expert",
    desc: "Log 100 meals",
    threshold: 100,
  },
];

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { goal, fetchGoal } = useGoalStore();
  const navigate = useNavigate();

  const API_BASE = "http://127.0.0.1:5001";

  // Profile form
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");

  // Dietary preferences & conditions
  const [dietary, setDietary] = useState("None");
  const [conditions, setConditions] = useState([]);
  const [conditionSaving, setConditionSaving] = useState(false);
  const [conditionMsg, setConditionMsg] = useState("");

  // Stats
  const [stats, setStats] = useState(null);

  // Danger zone
  const [deletePass, setDeletePass] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const activeUserId = user?.id || 2;

  useEffect(() => {
    fetchGoal(activeUserId);
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (goal?.health_conditions) {
      const list = goal.health_conditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      setConditions(list);
    }
  }, [goal]);

  // Load user profile and aggregate stats
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/user/${activeUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.user?.username || "");
        setEmail(data.user?.email || "");
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  };

  // Update username & email
  const handleProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/user/${activeUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("✅ Profile updated successfully!");
      } else {
        setMessage(`❌ ${data.error || data.message}`);
      }
    } catch {
      setMessage("❌ Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Save Health Conditions & Dietary Prefs directly to goals
  const handleSaveConditions = async () => {
    setConditionSaving(true);
    setConditionMsg("");
    try {
      const token = localStorage.getItem("token");
      const joinedConditions = conditions.join(", ");
      const response = await fetch(`${API_BASE}/goals/${activeUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(goal || {}),
          health_conditions: joinedConditions,
        }),
      });
      if (response.ok) {
        setConditionMsg("✅ Health preferences synced with nutrition goals!");
        fetchGoal(activeUserId);
      } else {
        setConditionMsg("❌ Failed to sync preferences");
      }
    } catch {
      setConditionMsg("❌ Connection error");
    } finally {
      setConditionSaving(false);
    }
  };

  // Change Password
  const handlePasswordChange = async () => {
    setPassMsg("");
    if (newPass !== confirmPass) {
      setPassMsg("❌ Passwords do not match!");
      return;
    }
    if (newPass.length < 6) {
      setPassMsg("❌ Password must be at least 6 characters!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: activeUserId,
          current_password: currentPass,
          new_password: newPass,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPassMsg("✅ Password changed successfully!");
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      } else {
        setPassMsg(`❌ ${data.error}`);
      }
    } catch {
      setPassMsg("❌ Failed to connect to authentication server");
    }
  };

  const toggleCondition = (condition) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  // Export Data (CSV or JSON)
  const handleExport = (format) => {
    window.open(
      `${API_BASE}/analytics/export?user_id=${activeUserId}&format=${format}`,
      "_blank",
    );
  };

  // Reset Meal & Hydration Logs
  const handleReset = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/analytics/reset-logs`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: activeUserId }),
      });
      const data = await response.json();
      alert(data.message || "Logs reset successfully");
      setShowReset(false);
      loadUserData();
    } catch {
      alert("Failed to reset logs");
    }
  };

  // Delete User Account
  const handleDeleteAccount = async () => {
    if (!deletePass) {
      alert("Please enter your password to verify deletion!");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/user/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: activeUserId,
          password: deletePass,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Account permanently deleted.");
        logout();
        navigate("/login");
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch {
      alert("Failed to delete account");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : "U";

  const earnedBadge = (badge) => {
    if (!stats) return false;
    if (badge.id === "meals50") return (stats.total_meals || 0) >= 50;
    if (badge.id === "meals100") return (stats.total_meals || 0) >= 100;
    if (badge.id === "logger7") return (stats.total_days || 0) >= 7;
    if (badge.id === "logger30") return (stats.total_days || 0) >= 30;
    if (badge.id === "water7") return (stats.total_days || 0) >= 7;
    return false;
  };

  return (
    <div className="page page--narrow">
      <div className="section-header mb-4">
        <div className="section-title">👤 Profile Settings</div>
        <p className="section-sub">
          Manage your account and personalized health settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="card mb-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00d2ff, #3a7bd5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {username || "User"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {email || "No email registered"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto" }}
          >
            ⇥ Logout
          </button>
        </div>

        {/* Aggregate Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: 8,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontWeight: 700, fontSize: 20, color: "var(--cyan)" }}
            >
              {stats?.total_meals || 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Meals Logged
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontWeight: 700, fontSize: 20, color: "var(--cyan)" }}
            >
              {stats?.total_days || 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Days Tracked
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>#{activeUserId}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              User ID
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          🏆 Milestone Badges
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 8,
          }}
        >
          {BADGES.map((badge) => {
            const earned = earnedBadge(badge);
            return (
              <div
                key={badge.id}
                title={badge.desc}
                style={{
                  textAlign: "center",
                  padding: 8,
                  borderRadius: 8,
                  background: earned ? "var(--cyan-tint)" : "var(--surface-2)",
                  border: `1px solid ${earned ? "var(--cyan)" : "var(--border)"}`,
                  opacity: earned ? 1 : 0.4,
                }}
              >
                <div style={{ fontSize: 24 }}>{badge.icon}</div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    marginTop: 4,
                    color: earned ? "var(--cyan)" : "var(--text-muted)",
                  }}
                >
                  {badge.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Personal Info */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          ✏️ Personal Info
        </p>
        <div className="field mb-3">
          <label className="label">Username</label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>
        <div className="field mb-3">
          <label className="label">Email Address</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
          />
        </div>
        {message && (
          <div
            style={{
              padding: "8px 12px",
              background: message.startsWith("✅")
                ? "var(--cyan-tint)"
                : "rgba(231, 76, 60, 0.1)",
              borderRadius: 8,
              fontSize: 13,
              color: message.startsWith("✅") ? "var(--cyan)" : "#e74c3c",
              marginBottom: 10,
            }}
          >
            {message}
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleProfile}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Health Conditions & Dietary Preferences */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          🏥 Health Conditions & Allergies
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {HEALTH_CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCondition(c)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1px solid ${conditions.includes(c) ? "var(--cyan)" : "var(--border)"}`,
                background: conditions.includes(c)
                  ? "var(--cyan-tint)"
                  : "transparent",
                color: conditions.includes(c) ? "var(--cyan)" : "var(--text)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {conditions.includes(c) ? "✓ " : ""}
              {c}
            </button>
          ))}
        </div>

        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          🥗 Dietary Preference
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {DIETARY_PREFS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDietary(d)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1px solid ${dietary === d ? "var(--cyan)" : "var(--border)"}`,
                background: dietary === d ? "var(--cyan-tint)" : "transparent",
                color: dietary === d ? "var(--cyan)" : "var(--text)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {dietary === d ? "✓ " : ""}
              {d}
            </button>
          ))}
        </div>

        {conditionMsg && (
          <div
            style={{
              padding: "8px 12px",
              background: conditionMsg.startsWith("✅")
                ? "var(--cyan-tint)"
                : "rgba(231, 76, 60, 0.1)",
              borderRadius: 8,
              fontSize: 13,
              color: conditionMsg.startsWith("✅") ? "var(--cyan)" : "#e74c3c",
              marginBottom: 10,
            }}
          >
            {conditionMsg}
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSaveConditions}
          disabled={conditionSaving}
        >
          {conditionSaving ? "Saving..." : "Sync Health Preferences"}
        </button>
      </div>

      {/* Change Password */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          🔐 Change Password
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="field">
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <div className="field">
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          {passMsg && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--surface-2)",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {passMsg}
            </div>
          )}
          <button className="btn btn-primary" onClick={handlePasswordChange}>
            Update Password
          </button>
        </div>
      </div>

      {/* Export Data */}
      <div className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
          📤 Export Your Data
        </p>
        <p
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}
        >
          Download all your logged meals, hydration entries, and nutritional
          targets.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => handleExport("csv")}
          >
            ⬇️ Export CSV
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => handleExport("json")}
          >
            ⬇️ Export JSON
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: "1px solid #e74c3c33" }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 14,
            color: "#e74c3c",
          }}
        >
          ⚠️ Danger Zone
        </p>

        {/* Reset Logs */}
        <div
          style={{
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Reset Daily Logs
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Delete all meals and water entries. Your user profile and calorie
            goals will be retained.
          </div>
          {!showReset ? (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #e74c3c",
                background: "transparent",
                color: "#e74c3c",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Reset Logs
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#e74c3c",
                  color: "white",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div
          style={{
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              marginBottom: 4,
              color: "#e74c3c",
            }}
          >
            Delete Account
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Permanently purge your account, meal logs, hydration history, and
            custom targets.
          </div>
          {!showDelete ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #e74c3c",
                background: "transparent",
                color: "#e74c3c",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Delete Account
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="password"
                className="input"
                value={deletePass}
                onChange={(e) => setDeletePass(e.target.value)}
                placeholder="Enter password to confirm"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#e74c3c",
                    color: "white",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Confirm Permanent Deletion
                </button>
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
