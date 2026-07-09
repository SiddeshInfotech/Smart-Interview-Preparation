import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { login } from "../api/authAPI";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("interviewee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await login({ email, password });
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      setLoading(false);
      return true;
    } catch (err) {
      console.log("Login error:", err);
    
      const extractMessage = (data) => {
        if (!data) return "Invalid email or password.";
        
            if (data.message && typeof data.message === "string") {
          return data.message;
        }
        
            if (typeof data === "string") {
          return data;
        }
        
            if (data.error && typeof data.error === "string") return data.error;
        if (data.detail && typeof data.detail === "string") return data.detail;
        

        if (typeof data === "object") {
          const messages = new Set();
          
          Object.values(data).forEach((value) => {
            if (Array.isArray(value)) {
              value.forEach((msg) => {
                if (msg && typeof msg === "string") {
                  messages.add(msg);
                }
              });
            } else if (value && typeof value === "string") {
              messages.add(value);
            }
          });
          
          if (messages.size > 0) {
            return [...messages].join("\n");
          }
        }
        
        return "Invalid email or password.";
      };
      
      setError(extractMessage(err.response?.data));
      setLoading(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address.";
    const passwordErr = password.length >= 8 ? "" : "Password must be at least 8 characters.";

    setFieldErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) {
      setError("");
      return;
    }

    try {
      const success = await handleLogin();
      if (success) navigate("/dashboard");
    } catch (err) {
      console.log("login submit error:", err);
      setError("Invalid email or password.");
    }
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
              onChange={(e) => {
                setEmail(e.target.value);
                // live field validation
                setFieldErrors((s) => ({ ...s, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value) ? "" : "Enter a valid email address." }));
              }}
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
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((s) => ({ ...s, password: e.target.value.length >= 8 ? "" : "Password must be at least 8 characters." }));
              }}
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
            {loading ? "Signing in..." : `Sign in as ${role === "interviewer" ? "Interviewer" : "Interviewee"}`}
          </button>
        </form>

        {(fieldErrors.email || fieldErrors.password) && (
          <div className="field-error" style={{ whiteSpace: "pre-line" }} role="alert">
            {fieldErrors.email}
            {fieldErrors.email && fieldErrors.password ? "\n" : ""}
            {fieldErrors.password}
          </div>
        )}

        {error && (
          <div className="field-error" style={{ whiteSpace: "pre-line" }} role="alert">
            {error}
          </div>
        )}

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