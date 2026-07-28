import React from 'react';
import { PlayCircle, Radar, FileText, CheckCircle2, ShieldCheck, PhoneCall, Sparkles, Code2, Check, Video, Award, TrendingUp, Compass, X as XIcon } from 'lucide-react';
import { PublicLayout } from '../components/Layouts.jsx';
import Button from '../components/Button.jsx';
import "../styles/home.css";

export default function Home() {
  return (
    <PublicLayout>

      {/* HERO SECTION */}
      <section className="container hero">
        <div className="hero-left-box">
          <span className="eyebrow-pill">
            <Sparkles size={14} className="pill-icon" />
            <span>AI-POWERED INTERVIEW PLATFORM</span>
            <span className="pill-live-dot"></span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", marginLeft: "6px" }}>
              • 10k+ Live Interviews
            </span>
          </span>
          
          <h1 className="hero-title">
            <span className="hero-title-main">Master the Art of the</span>{' '}
            <span className="accent">Technical Interview</span>
          </h1>
          
          <p className="lead">
            Experience high-fidelity AI coaching that simulates real engineering interviews.
            Get instant feedback on code quality, communication, and problem-solving.
          </p>
          
          <div className="hero__actions">
            <Button variant="primary" as="a" href="/register">Start Free Trial</Button>
            <Button variant="outline" as="a" href="#features" icon={<PlayCircle size={17} />}>View Demo</Button>
          </div>
        </div>

        {/* HERO CODE WINDOW CARD BOX */}
        <div className="mock-window">
          <div className="mock-window__bar">
            <div className="traffic-dots">
              <span className="mock-window__dot red" />
              <span className="mock-window__dot yellow" />
              <span className="mock-window__dot green" />
            </div>
            
            <div className="window-tab-active">
              <Code2 size={13} className="tab-icon" />
              <span>optimizeRoute.ts</span>
            </div>

            <span className="mock-window__title">PrepMasterAI</span>
          </div>

          <pre>{`function optimizeRoute(graph: Graph) {
  const pq = new PriorityQueue();
}

>> AI Feedback: Consider a greedy
  heuristic for space.`}</pre>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="container section" id="features">
        <div className="section-grid">
          
          {/* Core Tools Column */}
          <div>
            <h2 className="section-column-title">
              <Radar size={22} className="title-icon" /> Core Preparation Tools
            </h2>

            <div className="feature-row-box">
              <div className="feature-row__icon"><Radar size={22} /></div>
              <div className="feature-row__content">
                <strong>AI-Driven Feedback</strong>
                <p>Line-by-line code reviews, sentiment analysis, and solution optimizations.</p>
              </div>
            </div>

            <div className="feature-row-box">
              <div className="feature-row__icon"><FileText size={22} /></div>
              <div className="feature-row__content">
                <strong>Resume Intelligence</strong>
                <p>Custom interview questions automatically generated from your resume and target job role.</p>
              </div>
            </div>
          </div>

          {/* Ecosystem Column */}
          <div>
            <h2 className="section-column-title">
              <ShieldCheck size={22} className="title-icon" /> The Ecosystem
            </h2>

            <div className="check-row-box">
              <CheckCircle2 size={18} className="check-icon" />
              <span><strong>Candidate Hub:</strong> Personalized preparation roadmap & tracking.</span>
            </div>

            <div className="check-row-box">
              <CheckCircle2 size={18} className="check-icon" />
              <span><strong>Interviewer Center:</strong> Practice with structured evaluation rubrics.</span>
            </div>

            <div className="check-row-box">
              <CheckCircle2 size={18} className="check-icon" />
              <span><strong>Analytics:</strong> Accurate skill evaluation & performance breakdown.</span>
            </div>

            {/* UNIFORM STATS ROW */}
            <div className="stats-row">
              <div className="stat-card-box">
                <div className="stat-value">94%</div>
                <div className="stat-card__label">Success Rate</div>
              </div>

              <div className="stat-card-box">
                <div className="stat-value">10k+</div>
                <div className="stat-card__label">Active Users</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT US BOX CARD CONTAINER */}
      <section className="container section" id="about">
        <div className="about-card-box">
          <span className="about-tag">ABOUT PREPMASTER AI</span>
          <h2>Smart Interview Preparation Portal</h2>

          <p className="lead about-text">
            Smart Interview Preparation Portal is an AI-powered platform designed to help candidates
            prepare for technical interviews with total confidence. Our platform provides real-world
            interview simulations, coding assessments, AI-generated quizzes, resume analysis,
            and personalized feedback to improve technical skills and problem-solving abilities.
          </p>

          <p className="about-subtext">
            We combine artificial intelligence with modern interview preparation techniques
            to analyze performance, identify improvement areas, and provide smart guidance
            for better interview outcomes.
          </p>

          <p className="about-subtext">
            Our mission is to make interview preparation smarter, easier, and accessible
            for every candidate by providing the right tools, insights, and continuous support
            needed to succeed in real-world technical interviews.
          </p>

          <div className="about-advisor-box">
            <PhoneCall size={18} className="phone-icon" />
            <span>Talk to an Advisor: <strong>+91 91452 88018</strong></span>
          </div>

          {/* UNIFORM STATS ROW */}
          <div className="stats-row" style={{ marginTop: 28 }}>
            <div className="stat-card-box">
              <div className="stat-value">4+</div>
              <div className="stat-card__label">Core Features</div>
            </div>

            <div className="stat-card-box">
              <div className="stat-value">24/7</div>
              <div className="stat-card__label">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CANDIDATE SUCCESS ROADMAP (HOW IT WORKS) SECTION */}
      <section className="container section roadmap-section" id="how-it-works">
        <div className="roadmap-header">
          <span className="eyebrow-pill">
            <Compass size={14} className="pill-icon" />
            <span>CANDIDATE SUCCESS ROADMAP</span>
          </span>
          <h2 className="roadmap-main-title">
            How <span className="accent">PrepMaster AI</span> Powers Your Career
          </h2>
          <p className="roadmap-lead">
            A step-by-step guided trajectory engineered to transform your technical skills, build real interview confidence, and land top-tier software engineering offers.
          </p>
        </div>

        {/* ROADMAP TIMELINE GRID */}
        <div className="roadmap-grid">

          {/* STEP 1 */}
          <div className="roadmap-card">
            <div className="roadmap-card-header">
              <div className="roadmap-icon-box step-1-icon">
                <FileText size={24} />
              </div>
              <span className="roadmap-step-badge">STEP 01</span>
            </div>
            <span className="roadmap-phase-tag">Phase 1: Baseline Diagnosis</span>
            <h3>Smart Resume Parsing & Target Benchmarking</h3>
            <p>
              Upload your resume and select target job roles (e.g. Full Stack, Backend, Data Science). Our AI parses your experience, identifies technical gaps, and crafts personalized interview scenarios matched to real company rubrics.
            </p>
            <div className="roadmap-benefit-pill">
              <CheckCircle2 size={15} color="#10b981" />
              <span>100% role-tailored question pools</span>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="roadmap-card">
            <div className="roadmap-card-header">
              <div className="roadmap-icon-box step-2-icon">
                <Code2 size={24} />
              </div>
              <span className="roadmap-step-badge">STEP 02</span>
            </div>
            <span className="roadmap-phase-tag">Phase 2: Skill Building</span>
            <h3>Quizzes & Real-Time Code Arena</h3>
            <p>
              Master Data Structures, Algorithms, System Design, and CS Fundamentals through adaptive quizzes and a full-featured browser IDE with real-time test execution.
            </p>
            <div className="roadmap-benefit-pill">
              <CheckCircle2 size={15} color="#10b981" />
              <span>Instant syntax & complexity checks</span>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="roadmap-card">
            <div className="roadmap-card-header">
              <div className="roadmap-icon-box step-3-icon">
                <Video size={24} />
              </div>
              <span className="roadmap-step-badge">STEP 03</span>
            </div>
            <span className="roadmap-phase-tag">Phase 3: Live Simulation</span>
            <h3>High-Fidelity Mock Interviews</h3>
            <p>
              Experience realistic engineering interviews with expert interviewers or AI avatars. Solve live coding challenges under real pressure while articulating your technical decisions.
            </p>
            <div className="roadmap-benefit-pill">
              <CheckCircle2 size={15} color="#10b981" />
              <span>Recreates real-world interview pressure</span>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="roadmap-card">
            <div className="roadmap-card-header">
              <div className="roadmap-icon-box step-4-icon">
                <Radar size={24} />
              </div>
              <span className="roadmap-step-badge">STEP 04</span>
            </div>
            <span className="roadmap-phase-tag">Phase 4: Evaluation</span>
            <h3>Multi-Dimensional Competency Rating</h3>
            <p>
              Receive deep feedback across Technical Competency, Communication Skills, Problem Solving, Soft Skills, and Code Quality with actionable tips for improvement.
            </p>
            <div className="roadmap-benefit-pill">
              <CheckCircle2 size={15} color="#10b981" />
              <span>Line-by-line feedback & rating rubrics</span>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="roadmap-card roadmap-card-featured">
            <div className="roadmap-card-header">
              <div className="roadmap-icon-box step-5-icon">
                <TrendingUp size={24} />
              </div>
              <span className="roadmap-step-badge step-5-badge">STEP 05</span>
            </div>
            <span className="roadmap-phase-tag phase-5-tag">Phase 5: Career Success</span>
            <h3>Analytics Dashboard & AI Readiness Index</h3>
            <p>
              Monitor your day-wise performance progress graph, track your overall AI readiness index, and transform weak points until you are 100% ready to ace top tech rounds.
            </p>
            <div className="roadmap-benefit-pill">
              <CheckCircle2 size={15} color="#10b981" />
              <span>Data-backed readiness score & tracking</span>
            </div>
          </div>

        </div>

        {/* TESTIMONIALS + CTA GRID */}
        <div className="testimonial-grid" style={{ marginTop: 50 }}>

          <div className="testimonial-card-box">
            <div className="stars">★★★★★</div>
            <p>"AI feedback was a game-changer for my technical interviews."</p>
            <div className="testimonial-author">
              <div className="avatar">SC</div>
              <div>
                <strong>Sarah Chen</strong>
                <span>Senior Software Engineer</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card-box">
            <div className="stars">★★★★★</div>
            <p>"Felt like a real engineering interview experience. Highly recommended!"</p>
            <div className="testimonial-author">
              <div className="avatar">MT</div>
              <div>
                <strong>Marcus Thorne</strong>
                <span>Full Stack Engineer</span>
              </div>
            </div>
          </div>

          {/* CTA PANEL BOX */}
          <div className="cta-panel-box">
            <div className="cta-content">
              <h3>Ready to Level Up Your Career?</h3>
              <p>Join thousands of candidates getting hired at top engineering companies.</p>
            </div>

            <div className="cta-panel__actions">
              <Button variant="primary" full as="a" href="/register">Get Started Free</Button>
              <Button variant="ghost" full as="a" href="#about" style={{ color: '#fff' }}>
                Talk to Advisor
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="container section" id="pricing">

        {/* Section header */}
        <div className="pricing-section-header">
          <span className="about-tag">PRICING PLANS</span>
          <h2 className="pricing-section-title">
            Simple, Transparent Pricing
          </h2>
          <p className="pricing-section-subtitle">
            Choose the perfect plan to master your technical interviews and land your dream job.
          </p>
        </div>

        {/* Plan cards */}
        <div className="pricing-plans-grid">

          {/* FREE PLAN */}
          <div className="pricing-plan-card">
            <div className="pricing-plan-label">Free</div>
            <div className="pricing-plan-price">
              $0
              <span className="pricing-plan-period">/month</span>
            </div>
            <p className="pricing-plan-desc">
              Perfect for getting started with basic preparation and exploring the platform.
            </p>

            <ul className="pricing-feature-list">
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Quiz questions:</strong> 20 per day</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Coding questions:</strong> 20 per day</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Resume analysis:</strong> 5 per month</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Interview session:</strong> 30 min limit</span>
              </li>
              <li>
                <span className="pf-icon pf-cross"><XIcon size={14} /></span>
                <span className="pf-muted">Priority support</span>
              </li>
            </ul>

          </div>

          {/* PREMIUM PLAN */}
          <div className="pricing-plan-card pricing-plan-card--popular">
            <span className="pricing-popular-badge">🌟 Most Popular</span>
            <div className="pricing-plan-label">Premium</div>
            <div className="pricing-plan-price">
              $29
              <span className="pricing-plan-period">/month</span>
            </div>
            <p className="pricing-plan-desc">
              Comprehensive tools &amp; advanced analytics for serious FAANG-track candidates.
            </p>

            <ul className="pricing-feature-list">
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Quiz questions:</strong> Unlimited</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Coding questions:</strong> Unlimited</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Resume analysis:</strong> Unlimited</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Interview session:</strong> Up to 90 minutes</span>
              </li>
              <li>
                <span className="pf-icon pf-check"><Check size={14} /></span>
                <span><strong>Priority support</strong> included</span>
              </li>
            </ul>

          </div>

        </div>
      </section>

    </PublicLayout>
  );
}