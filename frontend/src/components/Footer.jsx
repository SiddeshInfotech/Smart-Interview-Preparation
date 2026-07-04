import React from 'react'

export default function Footer() {
  return (
    <footer className="footer">
      <span>InterviewAI &copy; {new Date().getFullYear()} InterviewAI Intelligent Systems. All rights reserved.</span>
      <div className="footer__links">
        <a href="#terms">Terms of Service</a>
        <a href="#privacy">Privacy Policy</a>
        <a href="#help">Help Center</a>
      </div>
    </footer>
  )
}