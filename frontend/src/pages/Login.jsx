import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import "../styles/Auth.css";
import { login } from "../api/axios";
import WelcomePopup from "../components/WelcomePopup";
import { useAuth } from "../context/AuthContext";

// Decode JWT payload without a library
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  // State for welcome popup
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await login({ email, password });
      console.log("Login Success:", response.data);

      await loginUser(response.data);

      const role = response.data.user?.role || localStorage.getItem("user_role") || "candidate";
      const name = response.data.user?.full_name || response.data.user?.name || "User";
      setUserName(name);

      setLoading(false);
      return role;
    } catch (err) {
      console.log("Login error:", err);
      console.log("Response:", err.response);
      console.log("Data:", err.response?.data);

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
                if (typeof msg === "string") {
                  messages.add(msg);
                }
              });
            } else if (typeof value === "string") {
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
      const role = await handleLogin();
      if (role) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.log("login submit error:", err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to access your technical interview coaching dashboard.</p>

        <form onSubmit={handleSubmit}>
          {/* EMAIL FIELD */}
          <div className="form-group">
            <label className="field-label" htmlFor="email">
              Professional Email
            </label>
            <div className="input-wrap">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((s) => ({ ...s, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value) ? "" : "Enter a valid email address." }));
                }}
                required
              />
            </div>
          </div>

          {/* PASSWORD FIELD */}
          <div className="form-group">
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
              <Lock className="input-icon" size={18} />
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* FIELD ERRORS */}
          {(fieldErrors.email || fieldErrors.password) && (
            <div className="field-error" style={{ whiteSpace: "pre-line" }} role="alert">
              <AlertCircle size={16} className="error-icon" />
              <div>
                {fieldErrors.email}
                {fieldErrors.email && fieldErrors.password ? "\n" : ""}
                {fieldErrors.password}
              </div>
            </div>
          )}

          {/* GENERAL ERROR */}
          {error && (
            <div className="field-error" style={{ whiteSpace: "pre-line" }} role="alert">
              <AlertCircle size={16} className="error-icon" />
              <div>{error}</div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button type="button" className="text-link" onClick={() => navigate("/register")}>
            Sign up for free
          </button>
        </p>

        <div className="ssl-row">
          <ShieldCheck size={14} /> 256-bit SSL Encrypted Login
        </div>
      </div>

      {/* Welcome Popup */}
      {showWelcome && (
        <WelcomePopup 
          userName={userName} 
          onClose={handleWelcomeClose} 
        />
      )}
    </div>
  );
}