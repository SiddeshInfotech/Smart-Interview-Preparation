import React, { useState } from "react";
import "../styles/CandidateProfile.css";

const skillSuggestions = [
  // Programming Languages
  "C",
  "C++",
  "C#",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "PHP",
  "Ruby",
  "R",
  "Dart",
  "Scala",
  "Perl",

  // Frontend
  "HTML",
  "CSS",
  "SASS",
  "Bootstrap",
  "Tailwind CSS",
  "Material UI",
  "React",
  "Next.js",
  "Angular",
  "Vue.js",
  "Nuxt.js",
  "Redux",
  "jQuery",

  // Backend
  "Node.js",
  "Express.js",
  "NestJS",
  "Django",
  "Flask",
  "FastAPI",
  "Spring Boot",
  "ASP.NET Core",
  ".NET",
  "Laravel",
  "Ruby on Rails",

  // Mobile Development
  "Android",
  "iOS",
  "React Native",
  "Flutter",
  "Xamarin",

  // Databases
  "MySQL",
  "PostgreSQL",
  "SQLite",
  "MongoDB",
  "MariaDB",
  "Oracle Database",
  "Microsoft SQL Server",
  "Firebase",
  "Redis",
  "Cassandra",
  "DynamoDB",

  // Cloud
  "AWS",
  "Microsoft Azure",
  "Google Cloud Platform",
  "DigitalOcean",
  "Heroku",
  "Vercel",
  "Netlify",

  // DevOps
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "GitHub Actions",
  "Terraform",
  "Ansible",
  "Nginx",
  "Apache",

  // APIs
  "REST API",
  "GraphQL",
  "gRPC",
  "WebSocket",

  // Testing
  "JUnit",
  "PyTest",
  "Jest",
  "Mocha",
  "Cypress",
  "Selenium",
  "Playwright",
  "Postman",

  // AI / ML / Data Science
  "Machine Learning",
  "Deep Learning",
  "Artificial Intelligence",
  "Natural Language Processing",
  "Computer Vision",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "Keras",
  "Pandas",
  "NumPy",
  "OpenCV",
  "LangChain",
  "OpenAI API",
  "Gemini API",

  // Data Engineering
  "Apache Spark",
  "Apache Kafka",
  "Hadoop",
  "Airflow",

  // Cybersecurity
  "Network Security",
  "Ethical Hacking",
  "Penetration Testing",
  "OWASP",
  "Kali Linux",
  "Wireshark",
  "Burp Suite",

  // Operating Systems
  "Linux",
  "Ubuntu",
  "Windows Server",

  // Software Engineering
  "Object-Oriented Programming",
  "Data Structures",
  "Algorithms",
  "System Design",
  "Microservices",
  "Design Patterns",
  "Agile",
  "Scrum",
  "CI/CD",

  // Game Development
  "Unity",
  "Unreal Engine",
  "Godot",
  "Blender",
  "Aseprite",

  // Embedded / IoT
  "Arduino",
  "Raspberry Pi",
  "Embedded C",

  // Version Control & Collaboration
  "Git Flow",
  "Jira",
  "Confluence",
  "Trello",
  "Slack",

  // Miscellaneous
  "Socket Programming",
  "Multithreading",
  "Operating Systems",
  "Computer Networks",
  "Database Management Systems",
  "Compiler Design",
  "Cloud Computing"
];

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
const IconCap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l10 5-10 5L2 8l10-5z" />
    <path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
  </svg>
);
const IconBriefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.55 1z" />
  </svg>
);
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
  </svg>
);
const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 17H7a5 5 0 010-10h2M15 7h2a5 5 0 010 10h-2M8 12h8" />
  </svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
const IconIdCard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M13 10h5M13 14h5" />
  </svg>
);

export default function CandidateProfile() {
  const [skills, setSkills] = useState(["React", "Python", "Node.js"]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const navItems = [
    { label: "Profile Setup", icon: <IconUser />, active: true },
    { label: "Education", icon: <IconCap />, active: false },
    { label: "Experience", icon: <IconBriefcase />, active: false },
    { label: "Skills", icon: <IconTarget />, active: false },
    { label: "Availability", icon: <IconCalendar />, active: false },
  ];

  return (
    <div className="cp-app">
      {/* Top Navbar */}
      <header className="cp-navbar">
        <div className="cp-logo">PrepMaster AI</div>
        <nav className="cp-nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#practice">Practice</a>
          <a href="#sessions">Sessions</a>
          <a href="#insights">Insights</a>
        </nav>
        <div className="cp-nav-icons">
          <span className="cp-icon"><IconBell /></span>
          <span className="cp-icon"><IconSettings /></span>
          <div className="cp-avatar">JD</div>
        </div>
      </header>

      <div className="cp-body">
        {/* Sidebar */}
        <aside className="cp-sidebar">
          <div className="cp-sidebar-header">
            <h3>Profile Completion</h3>
            <p>Step 1 of 5</p>
            <div className="cp-progress-track">
              <div className="cp-progress-fill" />
            </div>
          </div>

          <ul className="cp-nav-list">
            {navItems.map((item) => (
              <li
                key={item.label}
                className={`cp-nav-item ${item.active ? "active" : ""}`}
              >
                <span className="cp-nav-icon">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>

          <button className="cp-save-btn">Save Progress</button>
        </aside>

        {/* Main content */}
        <main className="cp-main">
          <div className="cp-main-header">
            <div>
              <h1>Build Your Professional Identity</h1>
              <p className="cp-subtitle">
                Provide details to help our AI personalize your experience.
              </p>
            </div>
            <div className="cp-candidate-meta">
              <div className="cp-candidate-id">
                <IconIdCard /> Candidate ID: <strong>CAND-8832</strong>
              </div>
              <p className="cp-meta-dates">
                Created: Oct 24, 2024 â€¢ Updated: Just now
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <section className="cp-section">
            <h2><IconUser /> Personal Information</h2>
            <hr />
            <div className="cp-grid-2">
              <div className="cp-field">
                <label>Full Name</label>
                <input type="text" defaultValue="John Doe" />
              </div>
              <div className="cp-field">
                <label>Date of Birth</label>
                <input type="date" placeholder="mm/dd/yyyy" />
              </div>
              <div className="cp-field">
                <label>Gender</label>
                <select defaultValue="">
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="cp-field">
                <label>Location</label>
                <div className="cp-icon-input">
                  <IconPin />
                  <input type="text" placeholder="City, Country" />
                </div>
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="cp-section">
            <h2><IconCap /> Education</h2>
            <hr />

            <div className="cp-grid-2">
              <div className="cp-field">
                <label>Highest Degree</label>
                <input
                  type="text"
                  placeholder="e.g. Bachelor of Computer Engineering"
                />
              </div>

              <div className="cp-field">
                <label>Institution</label>
                <input
                  type="text"
                  placeholder="e.g. ABC University"
                />
              </div>
            </div>
          </section>

          {/* Experience */}
          <section className="cp-section">
            <h2><IconBriefcase /> Experience</h2>
            <hr />

            {/* Years of Experience */}
            <div className="cp-field cp-years-field">
              <label>Years of Professional Experience</label>

              <div className="cp-years-input">
                <input
                  type="number"
                  placeholder="0"
                />
                <span>Years</span>
              </div>
            </div>

            {/* Technical Skills */}
            <div className="cp-field">
              <label>Technical Skills</label>

              <div className="cp-skills-box">
                {skills.map((skill, index) => (
                  <span className="cp-skill-chip" key={index}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                    >
                      &times;
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  list="skills-list"
                  placeholder="Type a skill and press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                />

                <datalist id="skills-list">
                  {skillSuggestions.map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
                </datalist>
              </div>

              <p className="cp-suggested">
                Suggested: Docker, AWS, System Design, TypeScript
              </p>
            </div>
          </section>

          {/* Digital Presence */}
          <section className="cp-section">
            <h2><IconLink /> Digital Presence</h2>
            <hr />
            <div className="cp-field">
              <label>LinkedIn Profile URL</label>
              <div className="cp-prefixed-input">
                <span>linkedin.com/in/</span>
                <input type="text" placeholder="username" />
              </div>
            </div>
            <div className="cp-field">
              <label>GitHub URL</label>
              <div className="cp-prefixed-input">
                <span>github.com/</span>
                <input type="text" placeholder="username" />
              </div>
            </div>
            <div className="cp-field">
              <label>Portfolio URL</label>
              <div className="cp-icon-input">
                <IconGlobe />
                <input type="text" placeholder="https://yourportfolio.com" />
              </div>
            </div>
          </section>

          <hr className="cp-footer-divider" />

          <div className="cp-footer">
            <a href="#back" className="cp-back-link">
              <IconArrowLeft /> Back to Dashboard
            </a>
            <div className="cp-footer-actions">
              <button className="cp-btn-cancel">Cancel</button>
              <button className="cp-btn-complete">Complete Profile</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}