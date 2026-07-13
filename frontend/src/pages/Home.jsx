import React from 'react'
import { Zap, PlayCircle, Radar, FileText, CheckCircle2 } from 'lucide-react'
import { PublicLayout } from '../components/Layouts.jsx'
import Button from '../components/Button.jsx'
import { Card } from '../components/Card.jsx'
import "../styles/home.css";

export default function Home() {
  return (
    <PublicLayout>
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
            Experience high-fidelity AI coaching that simulates real engineering interviews. Get
            instant feedback on code, communication, and problem-solving.
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

      <section className="container section" id="features">
        <div className="section-grid">
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>Core preparation tools</h2>
            <div className="feature-row">
              <div className="feature-row__icon"><Radar size={18} /></div>
              <div>
                <strong>AI-Driven Feedback</strong>
                <p>Line-by-line code reviews and sentiment analysis of verbal responses.</p>
              </div>
            </div>
            <div className="feature-row">
              <div className="feature-row__icon"><FileText size={18} /></div>
              <div>
                <strong>Resume Intelligence</strong>
                <p>Hyper-specific questions tailored to your experience and target JD.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>The Ecosystem</h2>
            <div className="check-row">
              <CheckCircle2 size={18} />
              <span><strong>Candidate preparation Hub:</strong> Personalized roadmaps and progress tracking.</span>
            </div>
            <div className="check-row">
              <CheckCircle2 size={18} />
              <span><strong>Interviewer Center:</strong> Structured rubrics for real-world peer practice.</span>
            </div>
            <div className="check-row">
              <CheckCircle2 size={18} />
              <span><strong>Enterprise Analytics:</strong> 98% accuracy in technical skill detection.</span>
            </div>

            <div className="stats-row">
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>94%</div>
                <div className="stat-card__label">Success Rate</div>
              </Card>
              <Card variant="dark" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>10k+</div>
                <div className="stat-card__label" style={{ color: 'rgba(255,255,255,0.6)' }}>Users</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container section" id="how-it-works">
        <div className="testimonial-grid">
          <Card>
            <div className="stars">★★★★★</div>
            <p>"AI feedback was a game-changer. It helped me articulate project experience with impact."</p>
            <div className="testimonial-author">
              <div className="avatar">SC</div>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5 }}>Sarah Chen</strong>
                <span style={{ fontSize: 12.5, color: 'var(--color-ink-soft)' }}>Senior Engineer, Stripe</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="stars">★★★★★</div>
            <p>"The collaborative IDE felt exactly like my Google interview. Finally landed my dream role."</p>
            <div className="testimonial-author">
              <div className="avatar">MT</div>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5 }}>Marcus Thorne</strong>
                <span style={{ fontSize: 12.5, color: 'var(--color-ink-soft)' }}>L5 Software Engineer</span>
              </div>
            </div>
          </Card>

          <div className="cta-panel" style={{ flexDirection: 'column', alignItems: 'flex-start' }} id="pricing">
            <div>
              <h3>Ready to Level Up?</h3>
              <p>Join thousands who increased their salary by 22%.</p>
            </div>
            <div className="cta-panel__actions" style={{ flexDirection: 'column', width: '100%' }}>
              <Button variant="primary" full as="a" href="/register">Get Started Free</Button>
              <Button variant="ghost" full style={{ color: '#fff' }}>Talk to Advisor</Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}