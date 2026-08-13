import React, { useEffect, useState, useMemo, useCallback } from "react";
import "../styles/Dashboard.css";
import { BookOpen, Code, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { fetchDashboardBootstrap } from "../api/dashboardApi";
import { formatMediaUrl } from "../api/courseApi";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const CustomTooltip = React.memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rawPayload = payload[0]?.payload || {};
    const dateLabel = rawPayload.date ? `${label} (${rawPayload.date})` : label;

    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-day">{dateLabel}</span>
          <span className="tooltip-badge">Daily Performance</span>
        </div>
        <div className="tooltip-list">
          {payload.map((item, idx) => {
            const val = item.value;
            let statusText = "Good";
            let statusClass = "status-good";
            if (val === 0) {
              statusText = "Not Attempted";
              statusClass = "status-unattempted";
            } else if (val >= 85) {
              statusText = "Excellent";
              statusClass = "status-excellent";
            } else if (val < 50) {
              statusText = "Needs Focus";
              statusClass = "status-focus";
            }

            return (
              <div key={idx} className="tooltip-item">
                <div className="tooltip-item-left">
                  <span
                    className="tooltip-dot"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                  />
                  <span className="tooltip-name">{item.name}</span>
                </div>
                <div className="tooltip-item-right">
                  <strong className="tooltip-val">{val}%</strong>
                  <span className={`tooltip-status-tag ${statusClass}`}>{statusText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
});

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [fullName, setFullName] = useState(() => {
    return userProfile?.name && userProfile.name !== "User" ? userProfile.name : "User";
  });

  const [activeMetric, setActiveMetric] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.name && userProfile.name !== "User") {
      setFullName(userProfile.name);
    } else {
      const userObjStr = localStorage.getItem("user");
      if (userObjStr) {
        try {
          const parsed = JSON.parse(userObjStr);
          const name = parsed.full_name || parsed.name || (parsed.first_name ? `${parsed.first_name} ${parsed.last_name || ''}`.trim() : parsed.username);
          if (name && name !== "Candidate") setFullName(name);
        } catch (e) { }
      }
    }
  }, [userProfile]);

  const user = useMemo(() => ({
    username: fullName,
  }), [fullName]);

  const getCachedDashboard = (key, fallback) => {
    try {
      const stored = localStorage.getItem(`cached_dashboard_${key}`);
      if (stored) return JSON.parse(stored);
    } catch (e) { }
    return fallback;
  };

  const [quizPerformance, setQuizPerformance] = useState(() =>
    getCachedDashboard("quiz", {
      total_quizzes: 0,
      minimum_score: 0,
      maximum_score: 0,
      average_score: 0,
      overall_score: 0,
    })
  );

  const [interviewPerformance, setInterviewPerformance] = useState(() =>
    getCachedDashboard("interview", {
      total_interviews: 0,
      technical_skills: 0,
      communication_skills: 0,
      problem_solving: 0,
      soft_skills: 0,
      overall_performance: 0,
    })
  );

  const [codingPerformance, setCodingPerformance] = useState(() =>
    getCachedDashboard("coding", {
      total_submissions: 0,
      logical_thinking: 0,
      code_efficiency: 0,
      language_skills: 0,
      problem_solving: 0,
      overall_score: 0,
    })
  );

  const [aiIntelligence, setAiIntelligence] = useState(() =>
    getCachedDashboard("ai", {
      overall_readiness: 0,
      metrics: {
        quiz_mastery: 0,
        coding_ability: 0,
        interview_skill: 0,
      },
    })
  );

  const [performanceData, setPerformanceData] = useState(() =>
    getCachedDashboard("daily_progress", [
      { day: "Mon", quiz: 0, coding: 0, interview: 0 },
      { day: "Tue", quiz: 0, coding: 0, interview: 0 },
      { day: "Wed", quiz: 0, coding: 0, interview: 0 },
      { day: "Thu", quiz: 0, coding: 0, interview: 0 },
      { day: "Fri", quiz: 0, coding: 0, interview: 0 },
      { day: "Sat", quiz: 0, coding: 0, interview: 0 },
      { day: "Sun", quiz: 0, coding: 0, interview: 0 },
    ])
  );

  // SINGLE OPTIMIZED BOOTSTRAP API CALL WITH DEDUPLICATION & AUTO-REFRESH
  useEffect(() => {
    let isMounted = true;

    const loadBootstrap = async (force = false) => {
      try {
        const data = await fetchDashboardBootstrap(force);
        if (!isMounted || !data) return;

        const {
          quiz_performance,
          interview_performance,
          coding_performance,
          ai_intelligence,
          daily_progress,
          profile,
          usage,
          notifications,
        } = data;

        if (profile?.full_name && profile.full_name !== "User") {
          setFullName(profile.full_name);
        }

        if (profile) {
          const role = localStorage.getItem("user_role") || "candidate";
          let profilePic = null;
          if (profile.profile_picture) {
            profilePic = formatMediaUrl(profile.profile_picture);
          }
          const updatedProfile = {
            name: profile.full_name || profile.name || "User",
            email: profile.email || "",
            profilePicture: profilePic,
            role: role,
          };
          localStorage.setItem("cached_user_profile", JSON.stringify(updatedProfile));
          window.dispatchEvent(new Event("profileUpdate"));
        }

        if (notifications) {
          localStorage.setItem("cached_notifications", JSON.stringify(notifications));
          window.dispatchEvent(new CustomEvent("notificationUpdate", { detail: { notifications } }));
        }

        if (quiz_performance) {
          setQuizPerformance(quiz_performance);
          localStorage.setItem("cached_dashboard_quiz", JSON.stringify(quiz_performance));
        }
        if (interview_performance) {
          setInterviewPerformance(interview_performance);
          localStorage.setItem("cached_dashboard_interview", JSON.stringify(interview_performance));
        }
        if (coding_performance) {
          setCodingPerformance(coding_performance);
          localStorage.setItem("cached_dashboard_coding", JSON.stringify(coding_performance));
        }
        if (ai_intelligence?.metrics) {
          setAiIntelligence(ai_intelligence);
          localStorage.setItem("cached_dashboard_ai", JSON.stringify(ai_intelligence));
        }
        if (daily_progress && daily_progress.length > 0) {
          setPerformanceData(daily_progress);
          localStorage.setItem("cached_dashboard_daily_progress", JSON.stringify(daily_progress));
        }
        if (usage) {
          localStorage.setItem("cached_user_usage", JSON.stringify(usage));
          window.dispatchEvent(new Event("usageUpdate"));
        }
      } catch (err) {
        console.warn("Dashboard bootstrap fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBootstrap(false);

    const onDashboardUpdate = () => {
      loadBootstrap(true);
    };

    window.addEventListener("dashboardUpdate", onDashboardUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboardUpdate", onDashboardUpdate);
    };
  }, []);

  const handleFilterChange = useCallback((metric) => {
    setActiveMetric(metric);
  }, []);

  const showQuiz = useMemo(() => activeMetric === "all" || activeMetric === "quiz", [activeMetric]);
  const showCoding = useMemo(() => activeMetric === "all" || activeMetric === "coding", [activeMetric]);
  const showInterview = useMemo(() => activeMetric === "all" || activeMetric === "interview", [activeMetric]);

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>
          <span className="welcome-text">Welcome Back, </span>
          <span className="username">{user.username}</span>
        </h1>
        <h2>PrepMaster Dashboard</h2>
        <p>
          Track your learning progress, interview readiness, and skill development.
        </p>
      </div>

      {/* Analytics Section */}
      <div className="overview-section">
        {/* Day-Wise Performance Analytics Graph */}
        <div className="graph-card">
          <div className="card-header">
            <div>
              <h3>Performance Analytics</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                Candidate daily performance tracking & skill trends (day-specific performance)
              </p>
            </div>

            {/* Interactive Filter Pills */}
            <div className="chart-filter-pills">
              <button
                className={`filter-pill ${activeMetric === "all" ? "active" : ""}`}
                onClick={() => handleFilterChange("all")}
              >
                All Metrics
              </button>
              <button
                className={`filter-pill quiz-pill ${activeMetric === "quiz" ? "active" : ""}`}
                onClick={() => handleFilterChange("quiz")}
              >
                Quiz
              </button>
              <button
                className={`filter-pill coding-pill ${activeMetric === "coding" ? "active" : ""}`}
                onClick={() => handleFilterChange("coding")}
              >
                Coding
              </button>
              <button
                className={`filter-pill interview-pill ${activeMetric === "interview" ? "active" : ""}`}
                onClick={() => handleFilterChange("interview")}
              >
                Interview
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={performanceData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="codingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />

              {showQuiz && (
                <Area
                  type="monotone"
                  dataKey="quiz"
                  stroke="#2563EB"
                  strokeWidth={3.5}
                  fill="url(#quizGrad)"
                  dot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#2563EB" }}
                  activeDot={{ r: 8, strokeWidth: 2.5, fill: "#2563EB", stroke: "#ffffff" }}
                  name="Quiz"
                />
              )}

              {showCoding && (
                <Area
                  type="monotone"
                  dataKey="coding"
                  stroke="#10B981"
                  strokeWidth={3.5}
                  fill="url(#codingGrad)"
                  dot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#10B981" }}
                  activeDot={{ r: 8, strokeWidth: 2.5, fill: "#10B981", stroke: "#ffffff" }}
                  name="Coding"
                />
              )}

              {showInterview && (
                <Area
                  type="monotone"
                  dataKey="interview"
                  stroke="#7C3AED"
                  strokeWidth={3.5}
                  fill="url(#interviewGrad)"
                  dot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#7C3AED" }}
                  activeDot={{ r: 8, strokeWidth: 2.5, fill: "#7C3AED", stroke: "#ffffff" }}
                  name="Interview"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profile Intelligence */}
        <div className="overall-card">
          <div className="ai-profile-header">
            <h3>Overall Progress</h3>
            <p>Smart Candidate Performance Analysis</p>
          </div>

          {/* Circular SVG Gauge */}
          <div className="ai-gauge-container">
            <svg className="ai-gauge-svg" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" className="gauge-track" strokeWidth="9" />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="gauge-fill"
                strokeWidth="9"
                stroke="url(#gaugeGrad)"
                strokeDasharray={314.159}
                strokeDashoffset={314.159 - (314.159 * (aiIntelligence.overall_readiness || 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-center-text">
              <span className="gauge-score-num">{aiIntelligence.overall_readiness || 0}%</span>
              <span className="gauge-score-label">Readiness</span>
            </div>
          </div>

          <div className="ai-metrics">
            {/* Quiz Mastery */}
            <div className="metric-card-row">
              <div className="metric-info-left">
                <div className="metric-icon-box quiz-icon-bg">
                  <BookOpen size={18} />
                </div>
                <div className="metric-text-group">
                  <span className="metric-title">Quiz Mastery</span>
                  <span className="metric-subtitle">Knowledge & Aptitude</span>
                </div>
              </div>
              <div className="metric-info-right">
                {aiIntelligence.metrics?.quiz_mastery > 0 && (
                  <span className={`metric-status-badge ${aiIntelligence.metrics.quiz_mastery >= 85 ? "tag-excellent" :
                      aiIntelligence.metrics.quiz_mastery >= 50 ? "tag-good" : "tag-practice"
                    }`}>
                    {aiIntelligence.metrics.quiz_mastery >= 85 ? "Excellent" :
                      aiIntelligence.metrics.quiz_mastery >= 50 ? "Good" : "Needs Practice"}
                  </span>
                )}
                <div className="score-pill-chip quiz-score-chip">
                  {aiIntelligence.metrics?.quiz_mastery || 0}%
                </div>
              </div>
            </div>

            {/* Coding Ability */}
            <div className="metric-card-row">
              <div className="metric-info-left">
                <div className="metric-icon-box coding-icon-bg">
                  <Code size={18} />
                </div>
                <div className="metric-text-group">
                  <span className="metric-title">Coding Ability</span>
                  <span className="metric-subtitle">Logic & Execution</span>
                </div>
              </div>
              <div className="metric-info-right">
                {aiIntelligence.metrics?.coding_ability > 0 && (
                  <span className={`metric-status-badge ${aiIntelligence.metrics.coding_ability >= 85 ? "tag-excellent" :
                      aiIntelligence.metrics.coding_ability >= 50 ? "tag-good" : "tag-practice"
                    }`}>
                    {aiIntelligence.metrics.coding_ability >= 85 ? "Excellent" :
                      aiIntelligence.metrics.coding_ability >= 50 ? "Good" : "Needs Practice"}
                  </span>
                )}
                <div className="score-pill-chip coding-score-chip">
                  {aiIntelligence.metrics?.coding_ability || 0}%
                </div>
              </div>
            </div>

            {/* Interview Skill */}
            <div className="metric-card-row">
              <div className="metric-info-left">
                <div className="metric-icon-box interview-icon-bg">
                  <Video size={18} />
                </div>
                <div className="metric-text-group">
                  <span className="metric-title">Interview Skill</span>
                  <span className="metric-subtitle">Communication</span>
                </div>
              </div>
              <div className="metric-info-right">
                {aiIntelligence.metrics?.interview_skill > 0 ? (
                  <span className={`metric-status-badge ${aiIntelligence.metrics.interview_skill >= 85 ? "tag-excellent" :
                      aiIntelligence.metrics.interview_skill >= 50 ? "tag-good" : "tag-practice"
                    }`}>
                    {aiIntelligence.metrics.interview_skill >= 85 ? "Excellent" :
                      aiIntelligence.metrics.interview_skill >= 50 ? "Good" : "Needs Practice"}
                  </span>
                ) : (
                  <span className="metric-status-badge tag-unattempted">
                    Not Attempted
                  </span>
                )}
                <div className="score-pill-chip interview-score-chip">
                  {aiIntelligence.metrics?.interview_skill || 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="performance-section">
        {/* Quiz Performance */}
        <div className="performance-card quiz-card">
          <div className="performance-title">
            <div className="category-badge quiz-badge">
              <BookOpen size={22} />
            </div>
            <h3>Quiz Performance</h3>
          </div>

          <div className="performance-content">
            <div className="performance-row">
              <span>Total Quizzes</span>
              <strong>{quizPerformance.total_quizzes}</strong>
            </div>
            <div className="performance-row">
              <span>Minimum Score</span>
              <strong>{quizPerformance.minimum_score}%</strong>
            </div>
            <div className="performance-row">
              <span>Maximum Score</span>
              <strong>{quizPerformance.maximum_score}%</strong>
            </div>
            <div className="performance-row">
              <span>Average Score</span>
              <strong>{quizPerformance.average_score}%</strong>
            </div>

            <hr className="performance-divider" />

            <div className="performance-row total-performance">
              <span>Overall Quiz Performance</span>
              <strong className="performance-score">{quizPerformance.overall_score}%</strong>
            </div>
          </div>
        </div>

        {/* Coding Performance */}
        <div className="performance-card coding-card">
          <div className="performance-title">
            <div className="category-badge coding-badge">
              <Code size={22} />
            </div>
            <h3>Coding Performance</h3>
          </div>

          <div className="performance-content">
            <div className="performance-row">
              <span>Logical Thinking</span>
              <strong>{codingPerformance.logical_thinking || 0}%</strong>
            </div>
            <div className="performance-row">
              <span>Code Efficiency</span>
              <strong>{codingPerformance.code_efficiency || 0}%</strong>
            </div>
            <div className="performance-row">
              <span>Language Skills</span>
              <strong>{codingPerformance.language_skills || 0}%</strong>
            </div>
            <div className="performance-row">
              <span>Problem Solving</span>
              <strong>{codingPerformance.problem_solving || 0}%</strong>
            </div>

            <hr className="performance-divider" />

            <div className="performance-row total-performance">
              <span>Overall Coding Performance</span>
              <strong className="performance-score">{codingPerformance.overall_score || 0}%</strong>
            </div>
          </div>
        </div>

        {/* Interview Performance */}
        <div className="performance-card interview-card">
          <div className="performance-title">
            <div className="category-badge interview-badge">
              <Video size={22} />
            </div>
            <h3>Interview Performance</h3>
          </div>

          <div className="performance-content">
            <div className="performance-row">
              <span>Total Interviews</span>
              <strong>{interviewPerformance.total_interviews || 0}</strong>
            </div>
            <div className="performance-row">
              <span>Technical Competency</span>
              <strong>{interviewPerformance.technical_skills || 0}%</strong>
            </div>
            <div className="performance-row">
              <span>Communication Skills</span>
              <strong>{interviewPerformance.communication_skills || 0}%</strong>
            </div>
            <div className="performance-row">
              <span>Problem Solving & Logic</span>
              <strong>{interviewPerformance.problem_solving || 0}%</strong>
            </div>
            <div className="performance-row">
              <span>Soft Skills & Professionalism</span>
              <strong>{interviewPerformance.soft_skills || 0}%</strong>
            </div>

            <hr className="performance-divider" />

            <div className="performance-row total-performance">
              <span>Overall Interview Performance</span>
              <strong className="performance-score">
                {interviewPerformance.overall_performance || 0}%
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;