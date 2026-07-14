import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const links = [
  { to: "/dashboard", label: "Overview", icon: "⊞" },
  { to: "/log", label: "Food Log", icon: "📋" },
  { to: "/nutrition", label: "Nutrient Goals", icon: "◎" },
  { to: "/profile", label: "Settings", icon: "👤" },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">D</div>
        <span className="navbar-title">Diet Tracker</span>
      </div>

      <div className="navbar-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-right">
        <div className="avatar">
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <button
          className="icon-btn"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title="Sign out"
        >
          ⇥
        </button>
      </div>
    </nav>
  );
}
