import React, { useState } from "react";
import "../styles/Login.css";


export default function Login() {
  const [activeTab, setActiveTab] = useState("create"); // "create" | "login"
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (activeTab === "create" && !form.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (activeTab === "create" && !agreed) {
      newErrors.agreed = "You must agree to the Terms of Service";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // UI only — wire this up to your auth API call
    console.log("Submitting:", { activeTab, ...form });
  };

  return (
    <div className="login-page">
      {/* Top nav */}
      <header className="login-navbar">
        <div className="login-navbar__brand">PrepAI</div>
        <nav className="login-navbar__links">
          <a href="/how-it-works">How it Works</a>
          <a href="/resources">Resources</a>
          <a href="/pricing">Pricing</a>
        </nav>
        <div className="login-navbar__actions">
          <a href="/login" className="login-navbar__login">Login</a>
          <button className="btn btn--primary">Sign Up</button>
        </div>
      </header>

      <main className="login-main">
        {/* Left column: marketing copy */}
        <section className="login-hero">
          <span className="login-hero__eyebrow">NEXT-GEN PREPARATION</span>
          <h1 className="login-hero__title">
            Master the Art of Interviewing.
          </h1>
          <p className="login-hero__subtitle">
            Join over 50,000 professionals using AI-driven behavioral analysis
            and domain-specific simulations to land their dream roles.
          </p>

          <div className="login-hero__roles">
            <div className="role-card">
              <div className="role-card__icon">👤</div>
              <div className="role-card__title">Candidate</div>
              <p className="role-card__desc">
                Practice mock sessions, get real-time feedback, and track your
                progress.
              </p>
            </div>
            <div className="role-card">
              <div className="role-card__icon">🗂</div>
              <div className="role-card__title">Interviewer</div>
              <p className="role-card__desc">
                Create technical questions and manage high-performing hiring
                pipelines.
              </p>
            </div>
          </div>

          <div className="ai-tip">
            <span className="ai-tip__icon">✦</span>
            <p>
              <strong>AI Coach Tip</strong>
              <br />
              "Candidates who practice with our AI-driven eye-contact tracker
              improve their perceived confidence scores by 40% in just three
              sessions."
            </p>
          </div>
        </section>

        {/* Right column: auth card */}
        <section className="login-card-wrapper">
          <div className="login-card">
            <div className="login-tabs">
              <button
                className={`login-tab ${activeTab === "create" ? "login-tab--active" : ""}`}
                onClick={() => setActiveTab("create")}
                type="button"
              >
                Create Account
              </button>
              <button
                className={`login-tab ${activeTab === "login" ? "login-tab--active" : ""}`}
                onClick={() => setActiveTab("login")}
                type="button"
              >
                Welcome Back
              </button>
            </div>

            <button type="button" className="btn btn--google">
              <span className="btn--google__icon">G</span>
              Continue with Google
            </button>

            <div className="divider">
              <span>OR EMAIL</span>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {activeTab === "create" && (
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <span className="input-error">{errors.name}</span>}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Professional Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="input-error">{errors.email}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="password">
                  {activeTab === "create" ? "Create Password" : "Password"}
                </label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.password && (
                  <span className="input-error">{errors.password}</span>
                )}
              </div>

              {activeTab === "create" && (
                <div className="checkbox-row">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <label htmlFor="agree">
                    I agree to the <a href="/terms">Terms of Service</a> and{" "}
                    <a href="/privacy">Privacy Policy</a>.
                  </label>
                </div>
              )}
              {errors.agreed && <span className="input-error">{errors.agreed}</span>}

              <button type="submit" className="btn btn--primary btn--block">
                {activeTab === "create" ? "Start My Journey" : "Log In"}
              </button>

              <p className="secure-note">🔒 256-bit SSL Secure Verification</p>
            </form>
          </div>
        </section>
      </main>

      <section className="verified-banner">
        <div>
          <h3>Identity Verified for Excellence</h3>
          <p>
            We partner with LinkedIn and top job boards to ensure every PrepAI
            profile is backed by professional integrity. Join a community of
            verified top-tier talent.
          </p>
        </div>
      </section>

      <footer className="login-footer">
        <span>PrepAI © 2024 PrepAI Intelligent Systems. All rights reserved.</span>
        <div className="login-footer__links">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/help">Help Center</a>
          <a href="/contact">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}