import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    // TODO: replace with your actual API call
    // await sendVerificationCode(email)
    setTimeout(() => {
      setSending(false);
      navigate("/otp", { state: { email } });
    }, 900);
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

          <button type="submit" className="primary-btn" disabled={sending}>
            {sending ? "Sending..." : "Send verification code"}
          </button>
        </form>
      </div>
    </div>
  );
}