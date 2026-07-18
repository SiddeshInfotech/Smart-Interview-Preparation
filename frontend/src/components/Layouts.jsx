import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Menu, X, LogIn, UserPlus } from "lucide-react";
import "../styles/Layouts.css"; // or your global styles

export const PublicLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="public-layout">
      {/* Header – same style as CandidateProfile */}
      <header className="public-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <Brain size={28} />
            <span>PrepMaster AI</span>
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </nav>

        <div className="header-right">
          {/* 👇 Sign In button – now styled like Sign Up */}
          <button className="btn-primary-small" onClick={() => navigate("/login")}>
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
          <button className="btn-primary-small" onClick={() => navigate("/register")}>
            <UserPlus size={16} />
            <span>Sign Up</span>
          </button>
        </div>
      </header>

      {/* Backdrop (mobile) */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar (mobile) – similar to CandidateProfile */}
      <aside className={`sidebar-mobile ${sidebarOpen ? "open" : ""}`}>
        <nav className="mobile-nav">
          <a href="#features" className="mobile-nav-link" onClick={() => setSidebarOpen(false)}>Features</a>
          <a href="#how-it-works" className="mobile-nav-link" onClick={() => setSidebarOpen(false)}>How It Works</a>
          <a href="#pricing" className="mobile-nav-link" onClick={() => setSidebarOpen(false)}>Pricing</a>
          <hr className="mobile-divider" />
          <button className="mobile-nav-btn" onClick={() => { setSidebarOpen(false); navigate("/login"); }}>
            <LogIn size={18} /> Log In
          </button>
          <button className="mobile-nav-btn primary" onClick={() => { setSidebarOpen(false); navigate("/register"); }}>
            <UserPlus size={18} /> Sign Up
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
};