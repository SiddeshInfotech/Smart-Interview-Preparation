import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("interviewee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call your sign-in API here with { role, email, password }
    console.log("sign in", { role, email, password });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Welcome back. Let's keep preparing.</p>

        <div className="role-toggle" role="tablist" aria-label="Sign in as">
          <button
            type="button"
            role="tab"
            aria-selected={role === "interviewee"}
            className={`role-btn ${role === "interviewee" ? "active" : ""}`}
            onClick={() => setRole("interviewee")}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            As an Interviewee
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "interviewer"}
            className={`role-btn ${role === "interviewer" ? "active" : ""}`}
            onClick={() => setRole("interviewer")}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 11l2 2 4-4M12 3l7 3v5c0 4.5-3 8.2-7 9-4-.8-7-4.5-7-9V6l7-3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            As an Interviewer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">
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
              id="email"
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              className="text-link small"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>
          <div className="input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>

          <button type="submit" className="primary-btn">
            Sign in as {role === "interviewer" ? "Interviewer" : "Interviewee"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button type="button" className="text-link" onClick={() => navigate("/register")}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}