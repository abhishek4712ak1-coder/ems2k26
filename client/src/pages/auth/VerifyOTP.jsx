import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyRegisterOTP } from "../../services/api.js";
import useAuth from "../../context/useAuth.js";
import AuthShell from "../../components/AuthShell.jsx";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMessage] = useState(() => location.state?.successMessage || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const response = await verifyRegisterOTP(email, otp);
      await checkAuth();
      navigate("/dashboard", {
        replace: true,
        state: {
          successMessage:
            response.message || "Registration successful. Welcome to ZEST 2K26!",
        },
      });
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Verify email"
      subtitle={`Enter the 6-digit code sent to ${email || "your email"}.`}
      footer={
        <div className="auth-links">
          Wrong email? <Link to="/register">Register again</Link>
        </div>
      }
    >
      {successMessage ? <div className="alert ok">{successMessage}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}
      <form onSubmit={handleSubmit}>
        <label className="field">
          OTP
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            required
          />
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Verifying..." : "Verify & continue"}
        </button>
      </form>
    </AuthShell>
  );
};

export default VerifyOTP;
