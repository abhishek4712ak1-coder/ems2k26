import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/api.js";
import AuthShell from "../../components/AuthShell.jsx";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      const response = await registerUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`, {
        state: {
          successMessage:
            response.message || "OTP sent successfully. Check your email.",
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Join ZEST 2K26"
      subtitle="Create your account and start registering for the fest."
      footer={
        <div className="auth-links">
          Already registered? <Link to="/login">Login</Link>
        </div>
      }
    >
      {error ? <div className="alert err">{error}</div> : null}
      <form onSubmit={handleSubmit}>
        <label className="field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label className="field">
          Password
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label className="field">
          Confirm password
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Sending OTP..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
