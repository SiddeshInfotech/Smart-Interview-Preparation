import React, { useState } from "react";
import "../styles/Register.css";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [role, setRole] = useState("candidate"); // "candidate" | "interviewer"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!agreed) newErrors.agreed = "You must agree to the Terms of Service";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log("Registering:", { role, ...form });
  };

  return (
    <div className="register-page">
      <header className="register-navbar">
        <div className="register-navbar__brand">PrepAI</div>
        <nav className="register-navbar__links">
          <a href="/how-it-works">How it Works</a>
          <a href="/resources">Resources</a>
          <a href="/pricing">Pricing</a>
        </nav>
        <div className="register-navbar__actions">
          <a href="/login" className="register-navbar__login">Login</a>
          <button className="btn btn--primary">Sign Up</button>
        </div>
      </header>

      <main className="register-main">
        <section className="register-hero">
          <span className="register-hero__eyebrow">NEXT-GEN PREPARATION</span>
          <h1 className="register-hero__title">
            Create your account and start preparing.
          </h1>
          <p className="register-hero__subtitle">
            Join over 50,000 professionals using AI-driven behavioral analysis
            and domain-specific simulations to land their dream roles.
          </p>

          <div className="ai-tip">
            <span className="ai-tip__icon">✦</span>
            <p>
              <strong>AI Coach Tip</strong>
              <br />
              "Candidates who complete their profile in full see 2x more
              tailored practice recommendations."
            </p>
          </div>

          {/* NEW: fills the vertical space beside the taller form card,
              and reinforces trust/credibility right where someone is
              deciding whether to sign up. */}
          <div className="hero-stats">
            <div className="hero-stats__item">
              <span className="hero-stats__number">50k+</span>
              <span className="hero-stats__label">Professionals</span>
            </div>
            <div className="hero-stats__item">
              <span className="hero-stats__number">94%</span>
              <span className="hero-stats__label">Interview success rate</span>
            </div>
            <div className="hero-stats__item">
              <span className="hero-stats__number">4.9★</span>
              <span className="hero-stats__label">Average rating</span>
            </div>
          </div>
        </section>

        <section className="register-card-wrapper">
          <div className="register-card">
            <h2 className="register-card__title">Create Account</h2>

            <button type="button" className="btn btn--google">
              <span className="btn--google__icon">G</span>
              Continue with Google
            </button>

            <div className="divider">
              <span>OR EMAIL</span>
            </div>

            <form className="register-form" onSubmit={handleSubmit} noValidate>
              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-toggle__btn ${role === "candidate" ? "role-toggle__btn--active" : ""}`}
                  onClick={() => setRole("candidate")}
                >
                  👤 Candidate
                </button>
                <button
                  type="button"
                  className={`role-toggle__btn ${role === "interviewer" ? "role-toggle__btn--active" : ""}`}
                  onClick={() => setRole("interviewer")}
                >
                  🗂 Interviewer
                </button>
              </div>

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
                <label htmlFor="password">Create Password</label>
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
              {errors.agreed && <span className="input-error">{errors.agreed}</span>}

              <button type="submit" className="btn btn--primary btn--block">
                Start My Journey
              </button>

              <p className="secure-note">🔒 256-bit SSL Secure Verification</p>

              <p className="switch-auth">
                Already have an account? <a href="/login">Log in</a>
              </p>
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

      <footer className="register-footer">
        <span>PrepAI © 2024 PrepAI Intelligent Systems. All rights reserved.</span>
        <div className="register-footer__links">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/help">Help Center</a>
          <a href="/contact">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}