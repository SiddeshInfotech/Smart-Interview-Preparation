import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { fetchCourseDetails, getCachedCourseDetail, formatPdfUrl, generateModuleQuiz } from "../api/courseApi";
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
  const [generatingQuizModuleId, setGeneratingQuizModuleId] = useState(null);

  const loadCourseData = async (retries = 3) => {
    if (!initialCache) {
      setLoading(true);
    }
    setError(null);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetchCourseDetails(courseId, domainId);
        setCourse(res.data);
        setLoading(false);
        return;
      } catch (err) {
        console.warn(`[CourseDetail] Attempt ${attempt}/${retries} failed:`, err);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1500));
        } else if (!initialCache) {
          setError("Failed to load course details. Please ensure the Django backend (python manage.py runserver 8000) is running.");
        }
      }
    }
    setLoading(false);
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
    const mId = mod.module_id || mod.id;

    if (formattedUrl) {
      navigate(`/courses/${courseId}/pdf-viewer`, {
        state: {
          pdfUrl: formattedUrl,
          pdfTitle: cleanModuleTitle(mod.pdf_title) || `${cleanTitle} Notes`,
          moduleTitle: cleanTitle,
          courseTitle: cleanCourseTitle(course?.title || "Course"),
          domainId: domainId,
          moduleId: mId,
          isCompleted: mod.is_completed,
        },
      });
    } else {
      alert("No PDF document is attached to this module.");
    }
  };

  const handleTakeUnitQuiz = async (mod) => {
    const mId = mod.module_id || mod.id;
    if (!mId) {
      alert("Module ID not found.");
      return;
    }
    setGeneratingQuizModuleId(mId);
    const cleanTitle = cleanModuleTitle(mod.title);
    try {
      const res = await generateModuleQuiz(mId, cleanTitle, cleanCourseTitle(course?.title || "Course"), course?.domain_name || "");
      const questions = res.data?.questions || [];
      if (questions.length === 0) {
        alert("Failed to generate quiz questions for this unit.");
        return;
      }
      navigate("/quiz-page", {
        state: {
          questions,
          isUnitQuiz: true,
          moduleId: mId,
          courseId: courseId,
          domainId: domainId,
          unitTitle: cleanTitle,
          courseTitle: cleanCourseTitle(course?.title || "Course"),
          pdfUrl: formatPdfUrl(mod.pdf_url || mod.pdf_file),
          pdfTitle: cleanModuleTitle(mod.pdf_title) || `${cleanTitle} Notes`,
        },
      });
    } catch (err) {
      console.error("Failed to generate unit quiz:", err);
      const msg = err.response?.data?.error || err.message || "Failed to generate AI quiz for this unit.";
      alert(msg);
    } finally {
      setGeneratingQuizModuleId(null);
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
                    border: mod.is_completed ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                    background: mod.is_completed ? "#f0fdf4" : "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    padding: "18px 20px"
                  }}
                >
                  <div className="topic-card-top" style={{ marginBottom: 0 }}>
                    <div className="topic-title-wrapper" style={{ gap: "14px" }}>
                      <span
                        className="module-index-badge"
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "700",
                          background: mod.is_completed ? "#10b981" : undefined,
                          color: mod.is_completed ? "#ffffff" : undefined
                        }}
                      >
                        {index + 1}
                      </span>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h5 className="topic-title" style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                            {displayTitle}
                          </h5>

                          {/* Completed Sign in front of PDF */}
                          {mod.is_completed && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                border: "1px solid #86efac"
                              }}
                            >
                              <CheckCircle2 size={13} color="#16a34a" /> Completed
                            </span>
                          )}
                        </div>

                        {mod.file_size > 0 && (
                          <span style={{ fontSize: "0.78rem", color: "#6366f1", fontWeight: "600", marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <FileText size={14} color="#6366f1" />
                            {(mod.file_size / 1024).toFixed(1)} KB • PDF Document
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View & Take Quiz Action Buttons */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={{
                          background: "#4f46e5",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 18px",
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

                      <button
                        type="button"
                        style={{
                          background: mod.is_completed ? "#ecfdf5" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                          color: mod.is_completed ? "#047857" : "#ffffff",
                          border: mod.is_completed ? "1px solid #a7f3d0" : "none",
                          padding: "10px 18px",
                          borderRadius: "10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          cursor: generatingQuizModuleId === (mod.module_id || mod.id) ? "wait" : "pointer",
                          boxShadow: mod.is_completed ? "none" : "0 3px 12px rgba(124, 58, 237, 0.3)",
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => handleTakeUnitQuiz(mod)}
                        disabled={generatingQuizModuleId === (mod.module_id || mod.id)}
                        title="Take 10-question AI Quiz for this unit"
                      >
                        {generatingQuizModuleId === (mod.module_id || mod.id) ? (
                          <>
                            <Loader2 size={17} className="spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={17} />
                            <span>{mod.is_completed ? "Retake Quiz" : "Take Quiz"}</span>
                          </>
                        )}
                      </button>
                    </div>
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

