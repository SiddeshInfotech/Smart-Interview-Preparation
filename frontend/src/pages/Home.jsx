import React from 'react'
import { Zap, PlayCircle, Radar, FileText, CheckCircle2 } from 'lucide-react'
import { PublicLayout } from '../components/Layouts.jsx'
import Button from '../components/Button.jsx'
import { Card } from '../components/Card.jsx'
import "../styles/home.css";

export default function Home() {
  return (
    <PublicLayout>

      {/* HERO */}
      <section className="container hero">
        <div>
          <span className="eyebrow-pill">
            <Zap size={13} /> SYSTEM DESIGN MOCKS LIVE
          </span>
          <h1>
            <span className="hero-title-main">Master the Art of the</span>{' '}
            <span className="accent">Technical Interview</span>
          </h1>
          <p className="lead">
            Experience high-fidelity AI coaching that simulates real engineering interviews.
            Get instant feedback on code, communication, and problem-solving.
          </p>
          <div className="hero__actions">
            <Button variant="primary" as="a" href="/register">Start Free Trial</Button>
            <Button variant="outline" icon={<PlayCircle size={17} />}>View Demo</Button>
          </div>
        </div>

        <div className="mock-window">
          <div className="mock-window__bar">
            <span className="mock-window__dot" />
            <span className="mock-window__dot" />
            <span className="mock-window__dot" />
          </div>
          <pre>{`function optimizeRoute(graph: Graph) {
  const pq = new PriorityQueue();
}

>> AI Feedback: Consider a greedy
  heuristic for space.`}</pre>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container section" id="features">
        <div className="section-grid">
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>Core preparation tools</h2>

            <div className="feature-row">
              <div className="feature-row__icon"><Radar size={18} /></div>
              <div>
                <strong>AI-Driven Feedback</strong>
                <p>Line-by-line code reviews and sentiment analysis.</p>
              </div>
            </div>

            <div className="feature-row">
              <div className="feature-row__icon"><FileText size={18} /></div>
              <div>
                <strong>Resume Intelligence</strong>
                <p>Questions tailored to your resume and job role.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>The Ecosystem</h2>

            <div className="check-row">
              <CheckCircle2 size={18} />
              <span><strong>Candidate Hub:</strong> Personalized roadmap & tracking.</span>
            </div>

            <div className="check-row">
              <CheckCircle2 size={18} />
              <span><strong>Interviewer Center:</strong> Practice with structured rubrics.</span>
            </div>

            <div className="check-row">
              <CheckCircle2 size={18} />
              <span><strong>Analytics:</strong> Accurate skill evaluation.</span>
            </div>

            <div className="stats-row">
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>94%</div>
                <div className="stat-card__label">Success Rate</div>
              </Card>

              <Card variant="dark" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>10k+</div>
                <div className="stat-card__label" >Users</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

    {/* ABOUT US */}
<section className="container section" id="about">
  <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
    <h2 style={{ fontSize: 26, marginBottom: 16 }}>About Us</h2>

    <p className="lead">
      Smart Interview Preparation Portal is an AI-powered platform designed to help students
      prepare for technical interviews with confidence. Our platform provides real-world
      interview simulations, coding assessments, AI-generated quizzes, resume analysis,
      and personalized feedback to improve technical skills and problem-solving abilities.
    </p>

    <p style={{ color: "var(--color-ink-soft)", marginTop: 10 }}>
      We combine artificial intelligence with modern interview preparation techniques
      to analyze performance, identify improvement areas, and provide smart guidance
      for better interview outcomes.
    </p>

    <p style={{ color: "var(--color-ink-soft)", marginTop: 10 }}>
      Our mission is to make interview preparation smarter, easier, and accessible
      for every student by providing the right tools, insights, and continuous support
      needed to succeed in real-world technical interviews.
    </p>

    <p style={{ color: "var(--color-ink-soft)", marginTop: 10 }}>
      📞 Talk to an Advisor: <strong>+91 91452 88018</strong>
    </p>

    <div className="stats-row" style={{ marginTop: 25 }}>
      <Card style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>
          4+
        </div>

        <div className="stat-card__label">
          Core Features
        </div>
      </Card>


      <Card variant="dark" style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>
          24/7
        </div>

        <div 
          className="stat-card__label"
         
        >
          AI Support
        </div>
      </Card>

    </div>
  </div>
</section>
  {/* TESTIMONIAL + CTA */}
      <section className="container section" id="how-it-works">
        <div className="testimonial-grid">

          <Card>
            <div className="stars">★★★★★</div>
            <p>"AI feedback was a game-changer."</p>
            <div className="testimonial-author">
              <div className="avatar">SC</div>
              <div>
                <strong>Sarah Chen</strong>
                <span>Senior Engineer</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stars">★★★★★</div>
            <p>"Felt like a real interview experience."</p>
            <div className="testimonial-author">
              <div className="avatar">MT</div>
              <div>
                <strong>Marcus Thorne</strong>
                <span>Software Engineer</span>
              </div>
            </div>
          </Card>

          <div className="cta-panel" style={{ flexDirection: 'column' }}>
            <h3>Ready to Level Up?</h3>
            <p>Join thousands of successful candidates.</p>

            <div className="cta-panel__actions" style={{ flexDirection: 'column', width: '100%' }}>
              <Button variant="primary" full as="a" href="/register">Get Started Free</Button>

              <Button 
                variant="ghost" 
                full 
                as="a" 
                href="#about" 
                style={{ color: '#fff' }}
              >
                Talk to Advisor
              </Button>

            </div>
          </div>

        </div>
      </section>

    </PublicLayout>
  )
}