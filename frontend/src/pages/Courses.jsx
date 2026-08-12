import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  Code,
  Brain,
  Layers,
  Users,
  Database,
  Terminal,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { fetchCourseBootstrap, getCachedBootstrapData } from "../api/courseApi";
import "../styles/Courses.css";

const cleanCourseTitle = (title) => {
  if (!title) return "";
  return title
    .replace(/\s*Masterclass\s*/gi, " ")
    .replace(/&\s*&/g, "&")
    .replace(/&\s*Notes/gi, "Notes")
    .replace(/\s+/g, " ")
    .trim();
};

const GRADIENTS = [
  "linear-gradient(135deg, #4f46e5, #7c3aed)",
  "linear-gradient(135deg, #0284c7, #2563eb)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #d97706, #f59e0b)",
  "linear-gradient(135deg, #7c3aed, #c026d3)",
  "linear-gradient(135deg, #dc2626, #ef4444)",
];

const ICONS = [
  <Brain key="brain" size={24} />,
  <Layers key="layers" size={24} />,
  <Code key="code" size={24} />,
  <Users key="users" size={24} />,
  <Database key="db" size={24} />,
  <Terminal key="terminal" size={24} />,
];

export default function Courses() {
  const navigate = useNavigate();

  // Instant Initial State from Cache if available
  const initialCache = getCachedBootstrapData();
  const [activeDomain, setActiveDomain] = useState(initialCache?.active_domain || null);
  const [availableDomains, setAvailableDomains] = useState(initialCache?.available_domains || []);
  const [domainCourses, setDomainCourses] = useState(initialCache?.courses || []);
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState(null);

  const loadBootstrapData = async (showLoader = false, retries = 3) => {
    if (showLoader && !initialCache) {
      setLoading(true);
    }
    setError(null);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetchCourseBootstrap();
        setActiveDomain(res.data.active_domain);
        setAvailableDomains(res.data.available_domains || []);
        setDomainCourses(res.data.courses || []);
        setLoading(false);
        return;
      } catch (err) {
        console.warn(`[Courses] Attempt ${attempt}/${retries} failed:`, err);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1500));
        } else if (!initialCache) {
          setError("Failed to connect to course server. Please ensure the Django backend (python manage.py runserver 8000) is running.");
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBootstrapData(!initialCache);
  }, []);

  const handleGoToCourse = (courseId) => {
    navigate(`/courses/${courseId}`, {
      state: { domainId: activeDomain?.domain_id },
    });
  };

  if (loading) {
    return (
      <div className="courses-container">
        <div className="courses-loading-state">
          <Loader2 size={36} className="spin" color="#4f46e5" />
          <p>Loading domain courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-container">
        <div className="courses-error-state">
          <AlertCircle size={40} color="#ef4444" />
          <h3>Unable to load courses</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={loadBootstrapData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalCourses = domainCourses.length;
  const overallDomainProgress = totalCourses > 0
    ? Math.round(
      domainCourses.reduce(
        (acc, c) => acc + (parseFloat(c.progress_percentage) || 0),
        0
      ) / totalCourses
    )
    : 0;

  return (
    <div className="courses-container">
      {/* Page Header */}
      <div className="setup-header">
        <h1>
          <span className="quiz-gradient-title">Domain Courses & Learning Hub</span>
        </h1>
        <p>Courses dynamically added for your active candidate domain.</p>
        <div className="quiz-header-line" />
      </div>

      {/* Active Domain Header Banner */}
      <div className="courses-domain-banner">
        <div className="domain-banner-left">
          <div className="domain-banner-icon">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="domain-banner-label">Your Active Candidate Domain</div>
            <div className="domain-banner-value">
              {activeDomain ? activeDomain.name : "No Domain Selected"}
            </div>
          </div>
        </div>

        <div className="domain-banner-right">
          {activeDomain && (
            <div className="domain-overall-progress">
              <div className="progress-info">
                <span>Overall Domain Progress</span>
                <strong>: {overallDomainProgress}%</strong>
              </div>
              <div className="domain-progress-bar">
                <div
                  className="domain-progress-fill"
                  style={{ width: `${overallDomainProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {domainCourses.length > 0 ? (
          domainCourses.map((course, idx) => {
            const progressPct = Math.round(parseFloat(course.progress_percentage) || 0);
            const gradient = GRADIENTS[idx % GRADIENTS.length];
            const icon = ICONS[idx % ICONS.length];
            const isCompleted = progressPct >= 100;

            return (
              <div key={course.course_id} className="course-card">
                {/* Card Header */}
                <div className="course-card-header">
                  <div
                    className="course-card-icon-badge"
                    style={{ background: gradient }}
                  >
                    {icon}
                  </div>

                  <div className="course-badges-group">
                    {course.is_required ? (
                      <span className="course-card-badge required">Required</span>
                    ) : (
                      <span className="course-card-badge optional">Elective</span>
                    )}

                    {course.technology && (
                      <span className="course-card-badge tech">
                        {course.technology}
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Title & Description */}
                <h3 className="course-card-title">
                  {cleanCourseTitle(course.title)}
                </h3>
                <p className="course-card-desc">{course.description}</p>


                {/* Meta stats */}
                <div className="course-meta-row">
                  <span>
                    <Layers size={14} />
                    {course.total_modules || 0} Modules
                  </span>
                </div>

                {/* Progress Section */}
                <div className="course-progress-section">
                  <div className="course-progress-header">
                    <span>Course Progress</span>
                    <span className="progress-percent">
                      {isCompleted ? (
                        <span className="completed-tag">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      ) : (
                        `${progressPct}%`
                      )}
                    </span>
                  </div>

                  <div className="course-progress-track">
                    <div
                      className="course-progress-fill"
                      style={{
                        width: `${progressPct}%`,
                        background: isCompleted ? "#10b981" : undefined,
                      }}
                    />
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  className="btn-go-to-course"
                  onClick={() => handleGoToCourse(course.course_id)}
                >
                  <span>View Material</span>
                  <ArrowRight size={15} className="btn-arrow-icon" />
                </button>
              </div>
            );
          })
        ) : (

          <div className="courses-empty-state">
            <BookOpen size={48} color="#94a3b8" />
            <h3>No Courses Added to this Domain Yet</h3>
            <p>Admin can add new courses and PDF materials for this domain.</p>
          </div>
        )}
      </div>
    </div>
  );
}
