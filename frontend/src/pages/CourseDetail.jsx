import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  FileText,
  Eye,
  Loader2,
  AlertCircle
} from "lucide-react";
import { fetchCourseDetails, getCachedCourseDetail, formatPdfUrl } from "../api/courseApi";
import { prefetchPdf } from "../api/pdfCache";
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

const cleanModuleTitle = (title) => {
  if (!title) return "";
  return title
    .replace(/^(Topic\s*\d+(\.\d+)?[:\s_-]*)/i, "")
    .replace(/^(Unit\s*\d+[:\s_-]*)/i, "")
    .replace(/^(\d+(\.\d+)?[:\s._-]+)/, "")
    .trim();
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const domainId = location.state?.domainId || null;

  // Instant Initial State from Cache if available
  const initialCache = getCachedCourseDetail(courseId);
  const [course, setCourse] = useState(initialCache || null);
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState(null);

  const loadCourseData = async () => {
    if (!initialCache) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetchCourseDetails(courseId, domainId);
      setCourse(res.data);
    } catch (err) {
      console.error("Failed to load course details:", err);
      if (!initialCache) {
        setError("Failed to load course details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, domainId]);

  // Background Prefetching of First 3 Module PDFs
  useEffect(() => {
    if (course?.modules && course.modules.length > 0) {
      course.modules.slice(0, 3).forEach((mod) => {
        const rawUrl = mod.pdf_url || mod.pdf_file;
        const formattedUrl = formatPdfUrl(rawUrl);
        if (formattedUrl) {
          prefetchPdf(formattedUrl);
        }
      });
    }
  }, [course]);

  const handleOpenPdfViewer = (mod) => {
    const rawUrl = mod.pdf_url || mod.pdf_file;
    const formattedUrl = formatPdfUrl(rawUrl);
    const cleanTitle = cleanModuleTitle(mod.title);

    if (formattedUrl) {
      navigate(`/courses/${courseId}/pdf-viewer`, {
        state: {
          pdfUrl: formattedUrl,
          pdfTitle: cleanModuleTitle(mod.pdf_title) || `${cleanTitle} Notes`,
          moduleTitle: cleanTitle,
          courseTitle: cleanCourseTitle(course?.title || "Course"),
          domainId: domainId,
        },
      });
    } else {
      alert("No PDF document is attached to this module.");
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

  const courseDisplayTitle = cleanCourseTitle(course.title);

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
        </div>

        <h1 className="course-detail-title">{courseDisplayTitle}</h1>

        {/* Stats Row */}
        <div className="course-detail-stats">
          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <BookOpen size={20} />
            </div>
            <div className="stat-info">
              <label>Study Materials</label>
              <span>{course.total_modules || 0} PDF Documents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum Modules List */}
      <div className="course-detail-content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">
            <Layers size={22} color="#4f46e5" />
            Course Units & PDF Study Materials
          </h3>
        </div>

        <div className="module-accordion-list">
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((mod, index) => {
              const hasPdf = mod.pdf_url || mod.pdf_file;
              const displayTitle = cleanModuleTitle(mod.title);

              return (
                <div
                  key={mod.module_id || index}
                  className="topic-card"
                  onMouseEnter={() => {
                    const rawUrl = mod.pdf_url || mod.pdf_file;
                    const formattedUrl = formatPdfUrl(rawUrl);
                    if (formattedUrl) prefetchPdf(formattedUrl);
                  }}
                  style={{
                    marginBottom: "16px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    padding: "18px 20px"
                  }}
                >
                  <div className="topic-card-top" style={{ marginBottom: 0 }}>
                    <div className="topic-title-wrapper" style={{ gap: "14px" }}>
                      <span className="module-index-badge" style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                        {index + 1}
                      </span>

                      <div>
                        <h5 className="topic-title" style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
                          {displayTitle}
                        </h5>
                        {mod.file_size > 0 && (
                          <span style={{ fontSize: "0.78rem", color: "#6366f1", fontWeight: "600", marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <FileText size={14} color="#6366f1" />
                            {(mod.file_size / 1024).toFixed(1)} KB • PDF Document
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single "View" Button */}
                    <button
                      type="button"
                      style={{
                        background: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        cursor: hasPdf ? "pointer" : "not-allowed",
                        opacity: hasPdf ? 1 : 0.6,
                        boxShadow: "0 3px 12px rgba(79, 70, 229, 0.25)",
                        transition: "all 0.2s ease"
                      }}
                      onClick={() => handleOpenPdfViewer(mod)}
                      disabled={!hasPdf}
                      title={hasPdf ? "View unit PDF document" : "No PDF available"}
                    >
                      <Eye size={17} />
                      <span>View</span>
                    </button>
                  </div>
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
