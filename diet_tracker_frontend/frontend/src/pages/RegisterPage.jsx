import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function RegisterPage() {
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    const ok = await register(form.username, form.email, form.password);
    if (ok) {
      alert("Account created! Please login.");
      navigate("/login"); // go to login after register
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">D</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Diet Tracker</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start tracking your nutrition today</p>

        <form onSubmit={handleSubmit} className="col gap-3">
          <div className="field">
            <label className="label">Username</label>
            <input
              className="input"
              placeholder="Your username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label className="label">Confirm password</label>
            <input
              className="input"
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-solid btn-full mt-2"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
