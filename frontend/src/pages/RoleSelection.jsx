import React from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/RoleSelection.css";

import {
  User,
  ClipboardList,
  ShieldCheck,
  BrainCircuit,
  CalendarClock,
  Bell,
  Settings,
} from "lucide-react";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="role-page">

      {/* ================= NAVBAR ================= */}
      <header className="role-navbar">
        <div className="logo">
          PrepMaster <span>AI</span>
        </div>

        <nav className="nav-links">
          <a href="/">Dashboard</a>
          <a href="/">Practice</a>
          <a href="/">Sessions</a>
          <a href="/">Insights</a>
        </nav>

        <div className="nav-right">
          <button className="icon-btn">
            <Bell size={20} />
          </button>

          <button className="icon-btn">
            <Settings size={20} />
          </button>

          <img
            src="https://i.pravatar.cc/100"
            alt="profile"
            className="profile-img"
          />
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="role-container">

        <h1>Choose Your Path</h1>

        <p className="subtitle">
          Select your primary role to customize your PrepMaster experience
          <br />
          and access specialized tools.
        </p>

        <div className="cards">

          {/* Candidate */}

          <div className="role-card">

            <div className="icon-box purple">
              <User size={34} />
            </div>

            <h2>Candidate Profile</h2>

            <p>
              Complete your profile to access AI-driven mock interviews and
              career analytics. Gain insights into your performance and track
              your growth across technical and behavioral competencies.
            </p>

            <button
              className="primary-btn"
              onClick={() => navigate("/candidate-profile")}
            >
              Setup Candidate Profile →
            </button>

          </div>

          {/* Interviewer */}

          <div className="role-card">

            <div className="icon-box blue">
              <ClipboardList size={34} />
            </div>

            <h2>Interviewer Profile</h2>

            <p>
              Register as an evaluator to manage interview slots and provide
              candidate feedback. Access standardized assessment frameworks
              and collaborative scoring tools.
            </p>

            <button
              className="outline-btn"
              onClick={() => navigate("/interviewer-profile")}
            >
              Setup Interviewer Profile →
            </button>

          </div>

        </div>

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="role-footer">

        <div className="footer-item">
          <ShieldCheck size={18} />
          <span>Enterprise Grade Security</span>
        </div>

        <div className="footer-item">
          <BrainCircuit size={18} />
          <span>AI-Enhanced Analysis</span>
        </div>

        <div className="footer-item">
          <CalendarClock size={18} />
          <span>Real-time Scheduling</span>
        </div>

      </footer>

    </div>
  );
}