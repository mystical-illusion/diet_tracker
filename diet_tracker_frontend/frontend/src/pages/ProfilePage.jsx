import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: user?.username || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:5001/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: form.username }),
      });
      const data = await response.json();
      setMessage(data.message || "Profile updated!");
    } catch {
      setMessage("Failed to update profile");
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="page page--narrow">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">👤 Profile Settings</div>
        <p className="section-sub">View and update your account details</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-4">
        <div className="profile-avatar-lg">{initials}</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.username}</div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            {user?.email}
          </div>
        </div>

        <div className="border-top pt-3 mt-3">
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            ⇥ Logout
          </button>
        </div>
      </div>

      {/* Edit Profile */}
      <form onSubmit={handleProfile} className="card mb-4">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
          Personal Info
        </p>
        <div className="col gap-3">
          <div className="field">
            <label className="label">Username</label>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          {message && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--cyan-tint)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--cyan)",
              }}
            >
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="card">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
          Account Info
        </p>
        <div
          className="col gap-2"
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          <div className="row-between">
            <span>User ID</span>
            <span>{user?.id}</span>
          </div>
          <div className="row-between">
            <span>Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="row-between">
            <span>Username</span>
            <span>{user?.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
