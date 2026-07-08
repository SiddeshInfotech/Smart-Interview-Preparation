import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, User, Briefcase, Mail, Lock, UserRound } from "lucide-react";
import "../styles/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // TODO: replace with your real API call
      await new Promise((r) => setTimeout(r, 700));
      navigate("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-shell">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtext">
          Join over 50,000 professionals using AI-driven behavioral analysis.
        </p>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-toggle__btn ${role === "candidate" ? "active" : ""}`}
            onClick={() => setRole("candidate")}
          >
            <User size={15} /> Candidate
          </button>
          <button
            type="button"
            className={`role-toggle__btn ${role === "interviewer" ? "active" : ""}`}
            onClick={() => setRole("interviewer")}
          >
            <Briefcase size={15} /> Interviewer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Full Name</label>
          <div className="field-control">
            <UserRound size={16} className="field-icon" />
            <input
              className="input"
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <label className="field-label">Professional Email</label>
          <div className="field-control">
            <Mail size={16} className="field-icon" />
            <input
              className="input"
              type="email"
              name="email"
              placeholder="john@company.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <label className="field-label">Create Password</label>
          <div className="field-control">
            <Lock size={16} className="field-icon" />
            <input
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
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I agree to the <Link to="/terms">Terms of Service</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </span>
          </label>

          {error && <span className="field-error">{error}</span>}

          <button className="primary-btn" type="submit" disabled={loading}>
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