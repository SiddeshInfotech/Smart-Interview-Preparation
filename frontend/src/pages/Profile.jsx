// Profile.jsx - Pure Static Design (No API calls)
import React, { useState } from "react";
import {
  LayoutDashboard,
  Brain,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Globe,
  ExternalLink,
  Calendar,
  User,
  Camera,
  Award,
  Code,
  Clock,
  Edit,
} from "lucide-react";
import "../styles/Profile.css";

// Custom GitHub Icon
const GitHubIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.62.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

// Custom LinkedIn Icon
const LinkedInIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const Profile = () => {
  // Static profile data - no API calls
  const profile = {
    name: "Rahul Sharma",
    email: "rahul.sharma@email.com",
    date_of_birth: "1995-06-15",
    gender: "M",
    location: "Mumbai, India",
    education: "Bachelor of Technology - Computer Science",
    experience_years: 4.5,
    linkedin_url: "https://linkedin.com/in/rahulsharma",
    github_url: "https://github.com/rahulsharma",
    portfolio_url: "https://rahulsharma.dev",
    profile_picture: null,
    skills: ["React", "JavaScript", "Python", "AWS", "Docker", "TypeScript", "Node.js", "MongoDB"],
  };

  const getInitials = (name) => {
    if (!name) return "RS";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Not specified";
    }
  };

  const getGenderLabel = (gender) => {
    const genderMap = { M: "Male", F: "Female", O: "Other" };
    return genderMap[gender] || "Not specified";
  };

  const getExperienceLabel = (years) => {
    if (!years || years === 0) return "No experience";
    if (years === 1) return "1 year";
    return `${years} years`;
  };

  const getExperienceLevel = (years) => {
    if (years >= 5) return "Senior";
    if (years >= 3) return "Intermediate";
    if (years >= 1) return "Junior";
    return "Entry Level";
  };

  const getProfileCompletion = () => {
    const fields = [
      profile.name, profile.email, profile.date_of_birth,
      profile.gender, profile.location, profile.education,
      profile.experience_years, profile.linkedin_url,
      profile.github_url, profile.portfolio_url,
      profile.skills.length > 0,
    ];
    const filled = fields.filter(f => f && f !== "" && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="header-left">
          <div className="logo">
            <Brain size={28} />
            <span>PrepMaster AI</span>
          </div>
        </div>
        <nav className="nav-menu">
          <a href="/dashboard" className="nav-link">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a href="/practice" className="nav-link">
            <Brain size={18} /> Practice
          </a>
          <a href="/sessions" className="nav-link">
            <CalendarDays size={18} /> Sessions
          </a>
          <a href="/insights" className="nav-link">
            <BarChart3 size={18} /> Insights
          </a>
        </nav>
        <div className="header-right">
          <button className="header-icon"><Bell size={19} /></button>
          <button className="header-icon"><Settings size={19} /></button>
          <div className="profile-avatar">
            <UserCircle size={22} />
            <span>Rahul</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="profile-main">
        <div className="profile-container">
          {/* Profile Header Card */}
          <div className="profile-card profile-header-card">
            <div className="profile-cover"></div>
            <div className="profile-info-header">
              <div className="profile-avatar-section">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt={profile.name} className="profile-avatar-large" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <span className="avatar-initials">{getInitials(profile.name)}</span>
                  </div>
                )}
                <div className="profile-name-section">
                  <h1 className="profile-name">{profile.name}</h1>
                  <p className="profile-email">
                    <Mail size={16} />
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="profile-actions">
                <button className="edit-profile-btn">
                  <Edit size={16} />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="profile-grid">
            {/* Personal Information */}
            <div className="profile-card">
              <div className="card-header">
                <User size={20} className="card-icon" />
                <h3>Personal Information</h3>
              </div>
              <div className="card-content">
                <div className="info-item">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">
                    <Calendar size={14} />
                    {formatDate(profile.date_of_birth)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender</span>
                  <span className="info-value">{getGenderLabel(profile.gender)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">
                    <MapPin size={14} />
                    {profile.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Education & Experience */}
            <div className="profile-card">
              <div className="card-header">
                <GraduationCap size={20} className="card-icon" />
                <h3>Education & Experience</h3>
              </div>
              <div className="card-content">
                <div className="info-item">
                  <span className="info-label">Highest Education</span>
                  <span className="info-value">
                    <GraduationCap size={14} />
                    {profile.education}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Experience</span>
                  <span className="info-value">
                    <Briefcase size={14} />
                    {getExperienceLabel(profile.experience_years)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">
                    <Clock size={14} />
                    Active Member
                  </span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="profile-card profile-skills-card">
              <div className="card-header">
                <Code size={20} className="card-icon" />
                <h3>Skills</h3>
              </div>
              <div className="card-content">
                <div className="skills-grid">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-badge">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Digital Presence */}
            <div className="profile-card profile-digital-card">
              <div className="card-header">
                <Globe size={20} className="card-icon" />
                <h3>Digital Presence</h3>
              </div>
              <div className="card-content">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    <LinkedInIcon size={20} />
                    <span>LinkedIn Profile</span>
                    <ExternalLink size={14} className="external-icon" />
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="social-link github">
                    <GitHubIcon size={20} />
                    <span>GitHub Profile</span>
                    <ExternalLink size={14} className="external-icon" />
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="social-link portfolio">
                    <Globe size={18} />
                    <span>Portfolio Website</span>
                    <ExternalLink size={14} className="external-icon" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats / Quick Info */}
            <div className="profile-card profile-stats-card">
              <div className="card-header">
                <Award size={20} className="card-icon" />
                <h3>Quick Stats</h3>
              </div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Profile Completion</span>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${getProfileCompletion()}%` }}></div>
                  </div>
                  <span className="stat-percentage">{getProfileCompletion()}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Skills Count</span>
                  <span className="stat-number">{profile.skills.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Experience Level</span>
                  <span className="stat-badge">{getExperienceLevel(profile.experience_years)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;