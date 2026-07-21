import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

      // Store email for OTP page
      localStorage.setItem("reset_email", email);

      // Redirect after a short delay
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
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to sign in
        </button>

        <h1 className="auth-title small">Forgot password?</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send a 6-digit verification code.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="reset-email">
            Professional Email
          </label>
          <div className="input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 6h18v12H3V6zm0 0l9 7 9-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              id="reset-email"
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Show error or success messages */}
          {error && <div className="field-error">{error}</div>}
          {success && <div className="field-success">{success}</div>}

          <button type="submit" className="primary-btn" disabled={sending}>
            {sending ? "Sending..." : "Send verification code"}
          </button>
        </form>
      </div>
    </div>
  );
}