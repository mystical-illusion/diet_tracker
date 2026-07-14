import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const set = (k, v) => {
    clearError();
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) {
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">D</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
            Diet Tracker
          </span>
        </div>

        {/* Heading */}
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account to continue</p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="field">
            <label className="label">Email ID</label>
            <input
              className="input"
              type="text"
              placeholder="your@gmail.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: 4,
              background: "var(--cyan)",
              color: "#0d0f14",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 140ms ease, background 140ms ease",
              fontFamily: "var(--font)",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = "var(--cyan-dim)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "var(--cyan)";
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--cyan)", fontWeight: 600 }}
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
