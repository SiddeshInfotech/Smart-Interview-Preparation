import React from 'react'
import { Sparkles } from 'lucide-react'
import Button from './Button.jsx'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__brand-mark"><Sparkles size={14} /></span>
        InterviewAI
      </div>

      <nav className="navbar__links">
        <a href="#how-it-works">How it Works</a>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
      </nav>

      <div className="navbar__actions">
        <Button variant="ghost" size="sm" as="a" href="/login">Log In</Button>
        <Button variant="primary" size="sm" as="a" href="/register">Sign Up</Button>
      </div>
    </header>
  )
}