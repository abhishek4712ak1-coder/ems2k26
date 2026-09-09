import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  verifyForgotPasswordOTP,
  sendForgotPasswordOTP,
} from "../../services/api";
import AuthShell from "../../components/AuthShell.jsx";

function ForgotPasswordOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const response = await verifyForgotPasswordOTP(email, otp);
      setSuccess(response.message || "OTP verified successfully");
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 700);
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      setResending(true);
      await sendForgotPasswordOTP(email);
      setSuccess("A new OTP has been sent.");
      setCooldown(30);
    } catch (err) {
      setError(err.message || "Unable to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={`Enter the reset code sent to ${email || "your email"}.`}
      footer={
        <div className="auth-links">
          <Link to="/forgot-password">Use a different email</Link>
        </div>
      }
    >
      {success ? <div className="alert ok">{success}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}
      <form onSubmit={handleSubmit}>
        <label className="field">
          OTP
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          disabled={cooldown > 0 || resending}
          onClick={handleResend}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ForgotPasswordOTP;
