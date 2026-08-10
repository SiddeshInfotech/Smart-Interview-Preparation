import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  PlayCircle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Sparkles,
  Download
} from "lucide-react";
import { fetchCourseDetails, toggleTopicCompletion } from "../api/courseApi";
import "../styles/Courses.css";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const domainId = location.state?.domainId || null;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [togglingTopicId, setTogglingTopicId] = useState(null);

  const loadCourseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCourseDetails(courseId, domainId);
      setCourse(res.data);

      // Default expand first module
      if (res.data?.modules && res.data.modules.length > 0) {
        setExpandedModules({ [res.data.modules[0].module_id]: true });
      }
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

  const toggleModuleAccordion = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleToggleTopic = async (topicId) => {
    setTogglingTopicId(topicId);
    try {
      const res = await toggleTopicCompletion(topicId, domainId);
      
      // Update local state for fast reactive UI feedback
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;

        const updatedModules = prevCourse.modules.map((mod) => {
          const updatedTopics = mod.topics.map((top) => {
            if (top.topic_id === topicId) {
              return { ...top, is_completed: res.data.topic_completed };
            }
            return top;
          });
          return { ...mod, topics: updatedTopics };
        });

        return {
          ...prevCourse,
          progress: res.data.course_progress,
          modules: updatedModules,
        };
      });
    } catch (err) {
      console.error("Failed to toggle topic completion:", err);
      alert("Failed to update topic completion. Please try again.");
    } finally {
      setTogglingTopicId(null);
    }
  };

  const handleOpenMaterial = (url) => {
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
          Back to Courses
        </button>

        <div className="courses-error-state">
          <AlertCircle size={40} color="#ef4444" />
          <h3>Course Not Found</h3>
          <p>{error || "The requested course could not be loaded."}</p>
        </div>
      </div>
    );
  }

  const courseProgress = Math.round(parseFloat(course.progress) || 0);

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
          {course.technology?.name && (
            <span className="course-detail-badge">{course.technology.name}</span>
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
              <span>{course.total_modules || 0} Lessons</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <BookOpen size={20} />
            </div>
            <div className="stat-info">
              <label>Total Topics</label>
              <span>{course.total_topics || 0} Topics</span>
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

      {/* Course Curriculum Accordion */}
      <div className="course-detail-content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">
            <Layers size={22} color="#4f46e5" />
            Course Modules & Learning Topics
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
              const isExpanded = expandedModules[mod.module_id];
              const completedCount = mod.topics
                ? mod.topics.filter((t) => t.is_completed).length
                : 0;
              const totalCount = mod.topics ? mod.topics.length : 0;

              return (
                <div key={mod.module_id} className="module-accordion-item">
                  {/* Module Header */}
                  <div
                    className="module-accordion-header"
                    onClick={() => toggleModuleAccordion(mod.module_id)}
                  >
                    <div className="module-header-left">
                      <span className="module-index-badge">{index + 1}</span>
                      <div>
                        <h4 className="module-header-title">{mod.title}</h4>
                        {mod.description && (
                          <p className="module-header-desc">{mod.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="module-header-right">
                      <span className="module-topic-count">
                        {completedCount}/{totalCount} Completed
                      </span>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Module Topics List */}
                  {isExpanded && (
                    <div className="module-topics-content">
                      {mod.topics && mod.topics.length > 0 ? (
                        mod.topics.map((topic) => {
                          const isToggling = togglingTopicId === topic.topic_id;

                          return (
                            <div
                              key={topic.topic_id}
                              className={`topic-card ${
                                topic.is_completed ? "completed" : ""
                              }`}
                            >
                              <div className="topic-card-top">
                                <div className="topic-title-wrapper">
                                  <button
                                    type="button"
                                    className={`btn-topic-checkbox ${
                                      topic.is_completed ? "checked" : ""
                                    }`}
                                    onClick={() =>
                                      !isToggling && handleToggleTopic(topic.topic_id)
                                    }
                                    title={
                                      topic.is_completed
                                        ? "Mark topic as incomplete"
                                        : "Mark topic as complete"
                                    }
                                  >
                                    {isToggling ? (
                                      <Loader2 size={16} className="spin" />
                                    ) : topic.is_completed ? (
                                      <CheckCircle2 size={18} />
                                    ) : (
                                      <PlayCircle size={18} />
                                    )}
                                  </button>

                                  <div>
                                    <h5 className="topic-title">{topic.title}</h5>
                                    {topic.description && (
                                      <p className="topic-desc">{topic.description}</p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className={`btn-toggle-completion ${
                                    topic.is_completed ? "completed" : ""
                                  }`}
                                  onClick={() =>
                                    !isToggling && handleToggleTopic(topic.topic_id)
                                  }
                                >
                                  {topic.is_completed
                                    ? "Completed"
                                    : "Mark Complete"}
                                </button>
                              </div>

                              {/* Topic Materials Section */}
                              {topic.materials && topic.materials.length > 0 && (
                                <div className="topic-materials-section">
                                  <div className="materials-header">
                                    <FileText size={14} color="#6366f1" />
                                    <span>Learning Materials & Study PDFs</span>
                                  </div>

                                  <div className="materials-grid">
                                    {topic.materials.map((mat) => (
                                      <div
                                        key={mat.material_id}
                                        className="material-item-card"
                                      >
                                        <div className="material-icon">
                                          <FileText size={20} color="#ef4444" />
                                        </div>

                                        <div className="material-info">
                                          <span className="material-title">
                                            {mat.title}
                                          </span>
                                          {mat.file_size > 0 && (
                                            <span className="material-size">
                                              {(mat.file_size / 1024).toFixed(1)} KB • PDF
                                            </span>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          className="btn-open-pdf"
                                          onClick={() =>
                                            handleOpenMaterial(
                                              mat.file_url || mat.file
                                            )
                                          }
                                        >
                                          <span>Open PDF</span>
                                          <ExternalLink size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-topics-notice">
                          No topics added for this module yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="courses-empty-state">
              <BookOpen size={40} color="#94a3b8" />
              <p>No modules available for this course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
