import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendForgotPasswordOTP } from "../../services/api";
import AuthShell from "../../components/AuthShell.jsx";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const response = await sendForgotPasswordOTP(email.trim());
      setSuccess(response.message || "OTP sent successfully");
      setTimeout(() => {
        navigate(
          `/forgot-password/verify?email=${encodeURIComponent(
            email.trim().toLowerCase()
          )}`
        );
      }, 800);
    } catch (err) {
      setError(err.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email a 6-digit code to reset your password."
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
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ForgotPassword;
