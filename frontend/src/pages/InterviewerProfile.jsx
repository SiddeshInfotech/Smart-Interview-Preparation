import React, { useState } from "react";
import "./../styles/InterviewerProfile.css";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  Settings,
  User,
  GraduationCap,
  Briefcase,
  Brain,
  Calendar,
  ClipboardList,
  Cpu,
  Code2,
  Database,
  Shield,
  Smartphone,
  Cloud,
  Clock,
  CheckCircle,
  Plus,
  ChevronDown,
} from "lucide-react";

export default function InterviewerProfile() {
  const navigate = useNavigate();

  const [available, setAvailable] = useState(true);

  const [selectedDomains, setSelectedDomains] = useState([
    "System Design",
    "Algorithms",
  ]);

  const toggleDomain = (domain) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(
        selectedDomains.filter((d) => d !== domain)
      );
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  return (
    <div className="interviewer-page">

      {/* ================= NAVBAR ================= */}

      <header className="interviewer-navbar">

        <div className="logo">
          PrepMaster AI
        </div>

        <nav className="navbar-links">
          <a href="/">Dashboard</a>
          <a href="/">Practice</a>
          <a href="/">Sessions</a>
          <a href="/">Insights</a>
        </nav>

        <div className="navbar-right">
          <Bell size={20} />
          <Settings size={20} />

          <div className="profile-avatar">
            JD
          </div>
        </div>

      </header>

      {/* ================= BODY ================= */}

      <div className="interviewer-body">

        {/* ================= SIDEBAR ================= */}

        <aside className="sidebar">

          <h2>Profile Completion</h2>

          <p>Step 1 of 5</p>

          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>

          <div className="menu-item active">
            <User size={18}/>
            <span>Profile Setup</span>
          </div>

          <div className="menu-item">
            <GraduationCap size={18}/>
            <span>Education</span>
          </div>

          <div className="menu-item">
            <Briefcase size={18}/>
            <span>Experience</span>
          </div>

          <div className="menu-item">
            <Brain size={18}/>
            <span>Skills</span>
          </div>

          <div className="menu-item">
            <Calendar size={18}/>
            <span>Availability</span>
          </div>

          <div className="meta-box">

            <h5>SYSTEM METADATA</h5>

            <div className="meta-row">
              <span>Created at</span>
              <strong>Oct 12, 2023</strong>
            </div>

            <div className="meta-row">
              <span>Updated at</span>
              <strong>2 mins ago</strong>
            </div>

          </div>

          <button className="save-progress">
            Save Progress
          </button>

        </aside>

        {/* ================= MAIN CONTENT ================= */}

        <main className="content">

          <div className="header-row">

            <div>

              <h1>Interviewer Profile</h1>

              <p>
                Set up your technical interviewer profile to help us
                match you with the right candidates.
              </p>

            </div>

            <div className="id-card">

              <div>
                <small>INTERVIEWER ID</small>
                <strong>INT-9842-X</strong>
              </div>

              <div>
                <small>USER ID</small>
                <strong>USR_882194</strong>
              </div>

            </div>

          </div>

          {/* ================= PROFESSIONAL BACKGROUND ================= */}

          <section className="card">

            <div className="card-header">

              <h2>
                <ClipboardList size={22}/>
                Professional Background
              </h2>

              <div
                className="availability-toggle"
                onClick={() => setAvailable(!available)}
              >
                <span>Availability Toggle</span>

                <div
                  className={
                    available
                      ? "toggle active"
                      : "toggle"
                  }
                >
                  <CheckCircle size={18}/>
                </div>

                <span>
                  {available ? "Is Available" : "Unavailable"}
                </span>

              </div>

            </div>

            <div className="grid">

              <div className="form-group">
                <label>Designation / Role</label>
                <input
                  type="text"
                  defaultValue="Senior Software Engineer"
                />
              </div>

              <div className="form-group">
                <label>Department</label>

                <div className="select-box">

                  <select>
                    <option>Engineering</option>
                    <option>Product</option>
                    <option>QA</option>
                  </select>

                  <ChevronDown size={18}/>
                </div>

              </div>

              <div className="form-group">
                <label>Current Organization</label>

                <input
                  type="text"
                  defaultValue="TechCorp International"
                />
              </div>

              <div className="form-group">
                <label>
                  Years of Interviewing Experience
                </label>

                <div className="select-box">

                  <select>
                    <option>3-5 years</option>
                    <option>5-10 years</option>
                    <option>10+ years</option>
                  </select>

                  <ChevronDown size={18}/>
                </div>

              </div>

            </div>

          </section>
          
          {/* ================= AREAS OF EXPERTISE ================= */}

          <section className="card">

            <div className="card-header">
              <h2>
                <Cpu size={22} />
                Areas of Expertise
              </h2>

              <p className="section-text">
                Select the technologies and domains you are comfortable
                interviewing candidates in.
              </p>
            </div>

            <div className="domain-grid">

              <div
                className={selectedDomains.includes("System Design") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("System Design")}
              >
                <Code2 size={32} />
                <h4>System Design</h4>
              </div>

              <div
                className={selectedDomains.includes("Algorithms") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("Algorithms")}
              >
                <Cpu size={32} />
                <h4>Algorithms</h4>
              </div>

              <div
                className={selectedDomains.includes("Frontend") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("Frontend")}
              >
                <Code2 size={32} />
                <h4>Frontend</h4>
              </div>

              <div
                className={selectedDomains.includes("Backend") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("Backend")}
              >
                <Database size={32} />
                <h4>Backend</h4>
              </div>

              <div
                className={selectedDomains.includes("AI / ML") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("AI / ML")}
              >
                <Brain size={32} />
                <h4>AI / ML</h4>
              </div>

              <div
                className={selectedDomains.includes("Cloud") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("Cloud")}
              >
                <Cloud size={32} />
                <h4>Cloud</h4>
              </div>

              <div
                className={selectedDomains.includes("Cyber Security") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("Cyber Security")}
              >
                <Shield size={32} />
                <h4>Cyber Security</h4>
              </div>

              <div
                className={selectedDomains.includes("Mobile Development") ? "domain-card active" : "domain-card"}
                onClick={() => toggleDomain("Mobile Development")}
              >
                <Smartphone size={32} />
                <h4>Mobile Development</h4>
              </div>

            </div>

          </section>

          {/* ================= WEEKLY AVAILABILITY ================= */}

          <section className="card">

            <div className="card-header">

              <h2>
                <Clock size={22} />
                Weekly Availability
              </h2>

              <span className="timezone">
                Time Zone : UTC +05:30 (India Standard Time)
              </span>

            </div>

            <div className="availability-table">

              <div className="day-row">

                <div className="day-name">
                  Monday
                </div>

                <div className="slot-box">
                  09:00 AM - 11:00 AM
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

              <div className="day-row">

                <div className="day-name">
                  Tuesday
                </div>

                <div className="slot-box">
                  02:00 PM - 04:00 PM
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

              <div className="day-row">

                <div className="day-name">
                  Wednesday
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

              <div className="day-row">

                <div className="day-name">
                  Thursday
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

              <div className="day-row">

                <div className="day-name">
                  Friday
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

              <div className="day-row">

                <div className="day-name">
                  Saturday
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

              <div className="day-row">

                <div className="day-name">
                  Sunday
                </div>

                <button className="add-slot">
                  <Plus size={16} />
                  Add Slot
                </button>

              </div>

            </div>

            <div className="availability-note">
              <p>
                You can add multiple interview slots for each day. These
                slots will be visible to candidates when booking interviews.
              </p>
            </div>

          </section>

          {/* ================= ACTION BUTTONS ================= */}

          <div className="bottom-buttons">

            <button
              className="cancel-btn"
              onClick={() => navigate("/role-selection")}
            >
              Back
            </button>

            <button
              className="save-btn-main"
              onClick={() => alert("Profile Saved Successfully!")}
            >
              Save & Continue
            </button>

          </div>

        </main>

      </div>

    </div>
  );
}

