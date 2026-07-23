import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/adminApi";
import "../styles/AdminPanel.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin({ email, password });
      const { access_token, refresh_token, admin } = res.data;
      localStorage.setItem("admin_access_token", access_token);
      localStorage.setItem("admin_refresh_token", refresh_token);
      localStorage.setItem("admin_user", JSON.stringify(admin));
      navigate("/my_admin_panel");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Login failed. Check credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Icon */}
        <div className="admin-login-card__icon">⚙</div>

        <h1>Admin Panel</h1>
        <p>Sign in with your superuser credentials to continue.</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="admin-login-field">
            <label htmlFor="admin-email">Email address</label>
            <div className="admin-login-input-wrap">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18v12H3V6zm0 0l9 7 9-7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-login-input-wrap">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: "absolute",
                  right: "12px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  padding: 0,
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in to Admin Panel"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#94a3b8",
            marginTop: "20px",
            marginBottom: 0,
          }}
        >
          This area is restricted to superusers only.
        </p>
      </div>
    </div>
  );
}
