import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  PlayCircle,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { fetchCourseDetails, toggleModuleCompletion } from "../api/courseApi";
import "../styles/Courses.css";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const domainId = location.state?.domainId || null;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingModuleId, setTogglingModuleId] = useState(null);

  const loadCourseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCourseDetails(courseId, domainId);
      setCourse(res.data);
    } catch (err) {
      console.error("Failed to load course details:", err);
      setError("Failed to load course details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, domainId]);

  const handleToggleModule = async (moduleId) => {
    setTogglingModuleId(moduleId);
    try {
      const res = await toggleModuleCompletion(moduleId, domainId);
      
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;

        const updatedModules = prevCourse.modules.map((mod) => {
          if (mod.module_id === moduleId) {
            return { ...mod, is_completed: res.data.module_completed };
          }
          return mod;
        });

        return {
          ...prevCourse,
          progress_percentage: res.data.course_progress,
          modules: updatedModules,
        };
      });
    } catch (err) {
      console.error("Failed to toggle module completion:", err);
      alert("Failed to update module completion. Please try again.");
    } finally {
      setTogglingModuleId(null);
    }
  };

  const handleOpenPdf = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="courses-loading-state">
          <Loader2 size={36} className="spin" color="#4f46e5" />
          <p>Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-container">
        <button
          type="button"
          className="back-link-btn"
          onClick={() => navigate("/courses")}
        >
          <ArrowLeft size={18} />
          Back to Domain Courses
        </button>

        <div className="courses-error-state">
          <AlertCircle size={40} color="#ef4444" />
          <h3>Course Not Found</h3>
          <p>{error || "The requested course could not be loaded."}</p>
        </div>
      </div>
    );
  }

  const courseProgress = Math.round(parseFloat(course.progress_percentage) || 0);

  return (
    <div className="course-detail-container">
      {/* Back to Courses Link */}
      <button
        type="button"
        className="back-link-btn"
        onClick={() => navigate("/courses")}
      >
        <ArrowLeft size={18} />
        Back to Domain Courses
      </button>

      {/* Hero Banner */}
      <div className="course-detail-hero">
        <div className="course-detail-header-tags">
          {course.technology && (
            <span className="course-detail-badge">{course.technology}</span>
          )}
          {course.domain_name && (
            <span className="course-detail-badge domain-tag">{course.domain_name}</span>
          )}
          <span className="course-detail-level">• Interactive Learning Path</span>
        </div>

        <h1 className="course-detail-title">{course.title}</h1>
        {course.description && (
          <p className="course-detail-description">{course.description}</p>
        )}

        {/* Stats Row */}
        <div className="course-detail-stats">
          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <Layers size={20} />
            </div>
            <div className="stat-info">
              <label>Modules</label>
              <span>{course.total_modules || 0} Units</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <BookOpen size={20} />
            </div>
            <div className="stat-info">
              <label>Study Materials</label>
              <span>{course.total_modules || 0} PDF Documents</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <Award size={20} />
            </div>
            <div className="stat-info">
              <label>Your Progress</label>
              <span>{courseProgress}% Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum Modules List */}
      <div className="course-detail-content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">
            <Layers size={22} color="#4f46e5" />
            Course Units & PDF Materials
          </h3>
          <div className="course-progress-track hero-track">
            <div
              className="course-progress-fill hero-fill"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </div>

        <div className="module-accordion-list">
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((mod, index) => {
              const isToggling = togglingModuleId === mod.module_id;
              const hasPdf = mod.pdf_url || mod.pdf_file;

              return (
                <div
                  key={mod.module_id}
                  className={`topic-card ${mod.is_completed ? "completed" : ""}`}
                  style={{ marginBottom: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                >
                  <div className="topic-card-top">
                    <div className="topic-title-wrapper">
                      <button
                        type="button"
                        className={`btn-topic-checkbox ${
                          mod.is_completed ? "checked" : ""
                        }`}
                        onClick={() =>
                          !isToggling && handleToggleModule(mod.module_id)
                        }
                        title={
                          mod.is_completed
                            ? "Mark module as incomplete"
                            : "Mark module as complete"
                        }
                      >
                        {isToggling ? (
                          <Loader2 size={16} className="spin" />
                        ) : mod.is_completed ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <PlayCircle size={18} />
                        )}
                      </button>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="module-index-badge">{index + 1}</span>
                          <h5 className="topic-title" style={{ fontSize: "1.05rem", fontWeight: "600" }}>{mod.title}</h5>
                        </div>
                        {mod.description && (
                          <p className="topic-desc" style={{ marginTop: "4px" }}>{mod.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn-toggle-completion ${
                        mod.is_completed ? "completed" : ""
                      }`}
                      onClick={() =>
                        !isToggling && handleToggleModule(mod.module_id)
                      }
                    >
                      {mod.is_completed ? "Completed" : "Mark Complete"}
                    </button>
                  </div>

                  {/* Module PDF Material Section */}
                  {hasPdf && (
                    <div className="topic-materials-section" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                      <div className="materials-header">
                        <FileText size={14} color="#6366f1" />
                        <span>Unit Study Material PDF</span>
                      </div>

                      <div className="materials-grid">
                        <div className="material-item-card">
                          <div className="material-icon">
                            <FileText size={20} color="#ef4444" />
                          </div>

                          <div className="material-info">
                            <span className="material-title">
                              {mod.pdf_title || `${mod.title} Notes`}
                            </span>
                            {mod.file_size > 0 && (
                              <span className="material-size">
                                {(mod.file_size / 1024).toFixed(1)} KB • PDF
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="btn-open-pdf"
                            onClick={() =>
                              handleOpenPdf(mod.pdf_url || mod.pdf_file)
                            }
                          >
                            <span>Open PDF</span>
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-topics-notice">
              No modules added for this course yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
