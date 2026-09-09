import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/api";
import AuthShell from "../../components/AuthShell.jsx";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword(email, password, confirmPassword);
      setSuccess(response.message || "Password reset successfully");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="New password"
      subtitle={`Set a new password for ${email || "your account"}.`}
      footer={
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      }
    >
      {success ? <div className="alert ok">{success}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}
      <form onSubmit={handleSubmit}>
        <label className="field">
          New password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label className="field">
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ResetPassword;
