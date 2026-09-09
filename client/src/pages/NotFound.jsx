import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="auth-screen">
      <div className="glass auth-card" style={{ textAlign: "center" }}>
        <div className="kicker">404</div>
        <h1>Page not found</h1>
        <p className="lead">That route is not part of ZEST 2K26.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
