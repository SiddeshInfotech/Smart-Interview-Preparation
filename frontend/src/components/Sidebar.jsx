import React from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, BookOpen, Settings, HelpCircle, LogOut, Sparkles
} from 'lucide-react'
import Button from './Button.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/interview-dashboard', label: 'Scheduled Interviews', icon: CalendarDays },
  { to: '/candidate-profile', label: 'Candidate Pool', icon: Users },
  { to: '/resume-upload', label: 'Evaluation Library', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar__brand">
          <Sparkles size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
          InterviewAI Pro
        </div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="sidebar__link">
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar__footer">
        <Button variant="primary" full>New Interview Slot</Button>
        <a className="sidebar__link" href="#help"><HelpCircle size={17} />Help Center</a>
        <a className="sidebar__link" href="#logout"><LogOut size={17} />Logout</a>
      </div>
    </aside>
  )
}