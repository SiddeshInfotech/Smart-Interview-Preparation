import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Briefcase,
  KeyRound,
  Mail,
  Lock,
  UserRound,
  Phone,
  CheckCircle,
} from "lucide-react";
import "../styles/Register.css";
import {
  register,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  login,
} from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [role, setRole] = useState("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "otp") {
      const sanitized = value.replace(/[^0-9]/g, "").slice(0, 6);
      setForm({ ...form, otp: sanitized });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let text = "Weak";
    if (score >= 4) {
      text = "Strong";
    } else if (score >= 2) {
      text = "Medium";
    }
    return { score, text };
  };

  const handleSendOTP = async () => {
    if (!form.email) {
      setError("Email is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendRegistrationOTP(form.email);
      setOtpSent(true);
      setError("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!form.otp) {
      setError("OTP is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await verifyRegistrationOTP(form.email, form.otp);
      setOtpVerified(true);
      setError("");
      setOtpSuccess("Email verified successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const payload = {
      full_name: form.name,
      email: form.email,
      password: form.password,
      confirm_password: form.confirmPassword,
      phone_number: form.phone_number || "",
      role,
    };

    console.log("register payload:", payload);

    try {
      const response = await register(payload);
      console.log("register success:", response.data);
      
      // Auto-login the user
      try {
        const loginResponse = await login({ email: form.email, password: form.password });
        await loginUser(loginResponse.data);
        
        if (role === "interviewer") {
          navigate("/interviewer-profile");
        } else {
          navigate("/candidate-profile");
        }
      } catch (loginErr) {
        console.error("Auto-login failed:", loginErr);
        // Fallback to login page if auto-login fails for any reason
        navigate("/login");
      }
    } catch (err) {
      console.log("register error:", err.response?.data || err.message);

      const serverData = err.response?.data;

      const formatErrors = (errors) => {
        if (!errors) return "Something went wrong.";
        if (typeof errors === "string") return errors;

        const messages = new Set();
        Object.values(errors).forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((msg) => {
              if (msg === "Ensure this field has at least 8 characters.") {
                msg = "Ensure password has at least 8 characters.";
              }
              messages.add(msg);
            });
          } else {
            messages.add(value);
          }
        });

        return [...messages].join("\n");
      };

      setError(formatErrors(serverData));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      setError("Please verify your email with OTP first.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await handleRegister();
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="register-shell">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtext">
          Join over 50,000 professionals using AI-driven behavioral analysis.
        </p>

        <div className="role-toggle" role="tablist" aria-label="Registration Role">
          <button
            type="button"
            role="tab"
            aria-selected={role === "candidate"}
            className={`role-toggle__btn ${role === "candidate" ? "active" : ""}`}
            onClick={() => setRole("candidate")}
          >
            <User size={15} /> Candidate
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "interviewer"}
            className={`role-toggle__btn ${role === "interviewer" ? "active" : ""}`}
            onClick={() => setRole("interviewer")}
          >
            <Briefcase size={15} /> Interviewer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="field-label" htmlFor="register-name">
              Full Name
            </label>
            <div className="field-control">
              <UserRound size={16} className="field-icon" />
              <input
                id="register-name"
                className="input"
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Professional Email */}
          <div className="form-group">
            <label className="field-label" htmlFor="register-email">
              Professional Email
            </label>
            <div className="field-control">
              <Mail size={16} className="field-icon" />
              <input
                id="register-email"
                className="input otp-input"
                type="email"
                name="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={handleChange}
                disabled={otpVerified}
                required
              />

              {!otpVerified && (
                <button
                  type="button"
                  className="otp-btn"
                  onClick={handleSendOTP}
                  disabled={loading || otpSent}
                  aria-label="Send verification code to email"
                >
                  {loading && !otpSent ? "..." : "Send OTP"}
                </button>
              )}

              {otpVerified && (
                <div className="field-success" role="alert">
                  <CheckCircle size={16} />
                  {otpSuccess}
                </div>
              )}
            </div>
          </div>

          {/* Verification Code */}
          {otpSent && !otpVerified && (
            <div className="form-group">
              <label className="field-label" htmlFor="register-otp">
                Verification Code
              </label>
              <div className="field-control">
                <KeyRound size={16} className="field-icon" />
                <input
                  id="register-otp"
                  className="input"
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={form.otp}
                  onChange={handleChange}
                  maxLength={6}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setOtpSent(false);
                    setForm({ ...form, otp: "" });
                    setError("");
                  }}
                  style={{ flex: 1 }}
                >
                  Change Email
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleVerifyOTP}
                  disabled={loading || !form.otp || form.otp.trim().length < 6}
                  style={{
                    flex: 1,
                    opacity: (loading || !form.otp || form.otp.trim().length < 6) ? 0.55 : 1,
                    cursor: (loading || !form.otp || form.otp.trim().length < 6) ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="form-group">
            <label className="field-label" htmlFor="register-phone">
              Phone Number
            </label>
            <div className="field-control">
              <Phone size={16} className="field-icon" />
              <input
                id="register-phone"
                className="input"
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          </div>

          {/* Create Password */}
          <div className="form-group">
            <label className="field-label" htmlFor="register-password">
              Create Password
            </label>
            <div className="field-control">
              <Lock size={16} className="field-icon" />
              <input
                id="register-password"
                className="input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {form.password && (
              <div className="password-strength-container">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                    }}
                  />
                </div>
                <span className="strength-rating-text">
                  Password strength: <strong>{strength.text}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="field-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <div className="field-control">
              <Lock size={16} className="field-icon" />
              <input
                id="register-confirm-password"
                className="input"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-label="Agree to terms of service and privacy policy"
            />
            <span>
              I agree to the <Link to="/terms">Terms of Service</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </span>
          </label>

          {/* Form Level Error Message */}
          {error && (
            <div className="field-error" style={{ whiteSpace: "pre-line" }} role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button className="btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Creating Account…" : "Start My Journey"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="ssl-row">
          <ShieldCheck size={14} /> 256-bit SSL Secure Verification
        </div>
      </div>
    </div>
  );
}
