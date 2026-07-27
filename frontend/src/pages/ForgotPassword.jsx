import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import "../styles/Auth.css";
import { forgotPassword } from "../api/axios";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required.");
      return;
    }

    setError("");
    setSuccess("");
    setSending(true);

    try {
      const response = await forgotPassword({ email });
      console.log("Forgot password response:", response.data);
      setSuccess("OTP sent to your email. Redirecting...");

      localStorage.setItem("reset_email", email);

      setTimeout(() => {
        navigate("/otp", { state: { email } });
      }, 1500);
    } catch (err) {
      console.error("Forgot password error:", err);
      let errorMessage = "Failed to send OTP. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card compact">
        <button type="button" className="back-link" onClick={() => navigate("/login")}>
          <ArrowLeft size={16} />
          Back to sign in
        </button>

        <h1 className="auth-title small">Forgot Password?</h1>
        <p className="auth-subtitle">
          Enter your professional email below and we'll send you a 6-digit verification code.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label" htmlFor="reset-email">
              Professional Email
            </label>
            <div className="input-wrap">
              <Mail className="input-icon" size={18} />
              <input
                id="reset-email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Show error or success messages */}
          {error && (
            <div className="field-error" role="alert">
              <AlertCircle size={16} className="error-icon" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="field-success" role="alert">
              <CheckCircle size={16} />
              <div>{success}</div>
            </div>
          )}

          <button type="submit" className="primary-btn" disabled={sending}>
            {sending ? (
              <>
                <span className="spinner"></span>
                Sending Code...
              </>
            ) : (
              <>
                Send Verification Code <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}