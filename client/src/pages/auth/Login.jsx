import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../context/useAuth";
import AuthShell from "../../components/AuthShell.jsx";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage] = useState(() => location.state?.successMessage || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const response = await login(email.trim().toLowerCase(), password);
      navigate("/dashboard", {
        replace: true,
        state: {
          successMessage: response.message || "Login successful. Welcome back!",
        },
      });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to join events and manage your ZEST 2K26 profile."
      footer={
        <div className="auth-links">
          New here? <Link to="/register">Create an account</Link>
        </div>
      }
    >
      {successMessage ? <div className="alert ok">{successMessage}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}
      <form onSubmit={handleSubmit}>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          Password
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <Link to="/forgot-password" style={{ color: "var(--gold)", fontSize: 13 }}>
          Forgot password?
        </Link>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
