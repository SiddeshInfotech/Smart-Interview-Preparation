import React from 'react';
import { Zap, PlayCircle, Radar, FileText, CheckCircle2, ShieldCheck, PhoneCall, Sparkles, Star, Award, Users, Code2 } from 'lucide-react';
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

      {/* TESTIMONIALS + CTA SECTION */}
      <section className="container section" id="how-it-works">
        <div className="testimonial-grid">

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

    </PublicLayout>
  );
}