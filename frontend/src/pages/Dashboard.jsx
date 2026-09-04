import React, { useEffect, useState, useMemo, useCallback } from "react";
import "../styles/Dashboard.css";
import { BookOpen, Code, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { fetchDashboardBootstrap } from "../api/dashboardApi";
import { formatMediaUrl } from "../api/courseApi";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
} from "recharts";

const CustomTooltip = React.memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rawPayload = payload[0]?.payload || {};
    const dateLabel = rawPayload.date ? `${label} (${rawPayload.date})` : label;

    const getMetricColor = (name, fallbackColor) => {
      if (name === "Quiz") return "#2563EB";
      if (name === "Coding") return "#10B981";
      if (name === "Interview") return "#7C3AED";
      return fallbackColor && !fallbackColor.startsWith("url") ? fallbackColor : "#2563EB";
    };

    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-day">{dateLabel}</span>
          <span className="tooltip-badge">Daily Performance</span>
        </div>
        <div className="tooltip-list">
          {payload.map((item, idx) => {
            const val = item.value;
            const dotColor = getMetricColor(item.name, item.color || item.fill);
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
                    style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
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
          <span className="welcome-text">Welcome, </span>
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
            <BarChart
              data={performanceData}
              margin={{ top: 15, right: 25, left: 35, bottom: 35 }}
              barGap={6}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="quizBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="codingBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="interviewBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid-color, #cbd5e1)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--chart-tick-color, #334155)', fontSize: 13, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              >
                <Label
                  value="Days of the Week"
                  position="insideBottom"
                  offset={-20}
                  style={{ fill: 'var(--chart-label-color, #0f172a)', fontSize: 13, fontWeight: 700 }}
                />
              </XAxis>
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--chart-tick-color, #334155)', fontSize: 13, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                tickFormatter={(v) => `${v}%`}
              >
                <Label
                  value="Performance Score (%)"
                  angle={-90}
                  position="insideLeft"
                  offset={-20}
                  style={{ textAnchor: 'middle', fill: 'var(--chart-label-color, #0f172a)', fontSize: 13, fontWeight: 700 }}
                />
              </YAxis>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(148, 163, 184, 0.12)', radius: 6 }}
              />

              {showQuiz && (
                <Bar
                  dataKey="quiz"
                  name="Quiz"
                  fill="url(#quizBarGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              )}

              {showCoding && (
                <Bar
                  dataKey="coding"
                  name="Coding"
                  fill="url(#codingBarGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              )}

              {showInterview && (
                <Bar
                  dataKey="interview"
                  name="Interview"
                  fill="url(#interviewBarGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              )}
            </BarChart>
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


    </div>
  );
};

export default Dashboard;