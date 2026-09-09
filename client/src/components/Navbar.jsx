import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "../context/useAuth.js";

const tabs = [
  { label: "Home", path: "/dashboard" },
  { label: "Profile", path: "/profile" },
  { label: "Participation", path: "/participation" },
  { label: "Invitation", path: "/invitation" },
  { label: "Developer", path: "/developer" },
];

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="brand" onClick={() => setOpen(false)}>
          <div className="brand-mark">Z</div>
          <div className="brand-copy">
            <strong>
              ZEST <span>2K26</span>
            </strong>
            <small>Create · Compete · Celebrate</small>
          </div>
        </NavLink>

        <nav className="nav-tabs" aria-label="Main">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `nav-tab${isActive ? " active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" type="button" onClick={handleLogout}>
          Logout
        </button>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div className="mobile-menu">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setOpen(false)}
            >
              {tab.label}
            </NavLink>
          ))}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
