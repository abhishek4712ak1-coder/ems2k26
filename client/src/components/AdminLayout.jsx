import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";

const AdminLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <header className="admin-navbar">
        <NavLink className="admin-brand" to="/admin">
          <span className="admin-brand-mark">Z</span>
          <span><strong>ZEST 2K26</strong><small>ADMIN CONTROL CENTRE</small></span>
        </NavLink>
        <div className="admin-navbar-meta">
          <span className="admin-live"><i /> ADMIN</span>
          <span className="admin-user">{user?.email}</span>
          <button type="button" className="admin-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </header>
      <main className="admin-page-wrap">{children}</main>
    </div>
  );
};

export default AdminLayout;
