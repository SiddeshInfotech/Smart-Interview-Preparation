// CandidateProfile.jsx
import React, { useState, useRef } from "react";
import "../styles/CandidateProfile.css";

const CandidateProfile = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const profileRef = useRef(null);
  const educationRef = useRef(null);
  const experienceRef = useRef(null);
  const skillsRef = useRef(null);
  const availabilityRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    const refs = {
      profile: profileRef,
      education: educationRef,
      experience: experienceRef,
      skills: skillsRef,
      availability: availabilityRef,
    };
    scrollToSection(refs[section]);
  };

  return (
    <div className="candidate-profile">
      {/* Header */}
      <header className="header">
        <div className="logo">PrepMaster AI</div>
        <nav className="nav-menu">
          <span className="nav-link">Dashboard</span>
          <span className="nav-link">Practice</span>
          <span className="nav-link">Sessions</span>
          <span className="nav-link">Insights</span>
        </nav>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="profile-nav">
            <div 
              className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => handleNavClick("profile")}
            >
              Profile Setup
            </div>
            <div 
              className={`nav-item ${activeSection === "education" ? "active" : ""}`}
              onClick={() => handleNavClick("education")}
            >
              Education
            </div>
            <div 
              className={`nav-item ${activeSection === "experience" ? "active" : ""}`}
              onClick={() => handleNavClick("experience")}
            >
              Experience
            </div>
            <div 
              className={`nav-item ${activeSection === "skills" ? "active" : ""}`}
              onClick={() => handleNavClick("skills")}
            >
              Skills
            </div>
            <div 
              className={`nav-item ${activeSection === "availability" ? "active" : ""}`}
              onClick={() => handleNavClick("availability")}
            >
              Availability
            </div>
          </div>
          <button className="save-btn">Save Progress</button>
        </aside>

        {/* Content */}
        <main className="content">
          {/* Profile Setup */}
          <div ref={profileRef} className="profile-section" id="profile">
            <div className="section-header">
              <h2>Profile Setup</h2>
            </div>

            {/* Personal Information */}
            <div className="personal-info">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" defaultValue="John Doe" />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="text" placeholder="mm/dd/yyyy" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select>
                    <option>Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" placeholder="City, Country" />
                </div>
              </div>
            </div>

            {/* Education */}
            <div ref={educationRef} className="education-section">
              <h3>Education</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Highest Degree</label>
                  <input type="text" placeholder="eg Bachelor of Computer Engineering" />
                </div>
                <div className="form-group">
                  <label>Institution</label>
                  <input type="text" placeholder="eg ABC University" />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div ref={experienceRef} className="experience-section">
              <h3>Experience</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Job</label>
                  <input type="text" placeholder="eg Software Engineer" />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input type="text" placeholder="eg XYZ Corp" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="text" placeholder="MM/YYYY" />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="text" placeholder="MM/YYYY" />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div ref={skillsRef} className="skills-section">
              <h3>Skills</h3>
              <div className="skills-container">
                <label>Technical Skills</label>
                <div className="skill-tags">
                  {/* No default skills shown */}
                </div>
                <input 
                  type="text" 
                  placeholder="Type a skill and press Enter..." 
                />
                <div className="suggestions">
                  Suggested: Docker, AWS, System Design, TypeScript
                </div>
              </div>
            </div>

            {/* Availability */}
            <div ref={availabilityRef} className="availability-section">
              <h3>Availability</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Preferred Time</label>
                  <select>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Days Available</label>
                  <select multiple>
                    <option>Mon</option>
                    <option>Tue</option>
                    <option>Wed</option>
                    <option>Thu</option>
                    <option>Fri</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Digital Presence */}
            <div className="digital-presence">
              <h3>Digital Presence</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>LinkedIn Profile URL</label>
                  <input type="text" placeholder="linkedin.com/in/username" />
                </div>
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input type="text" placeholder="github.com/username" />
                </div>
              </div>
              <div className="form-group">
                <label>Portfolio URL</label>
                <input type="text" placeholder="https://yourportfolio.com" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-back">Back to Dashboard</button>
              <button className="btn-cancel">Cancel</button>
              <button className="btn-complete">Complete Profile</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateProfile;
