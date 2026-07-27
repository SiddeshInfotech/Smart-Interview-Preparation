import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { BookOpen, Code, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-day">{label} Progress</span>
          <span className="tooltip-badge">Live Score</span>
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
};

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [fullName, setFullName] = useState(() => {
    return userProfile?.name && userProfile.name !== "User" ? userProfile.name : "User";
  });

  const [activeMetric, setActiveMetric] = useState("all");

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

  const user = {
    username: fullName,
  };

  const [quizPerformance, setQuizPerformance] = useState({
    total_quizzes: 0,
    minimum_score: 0,
    maximum_score: 0,
    average_score: 0,
    overall_score: 0,
  });

  const [interviewPerformance, setInterviewPerformance] = useState({
    total_interviews: 0,
    technical_skills: 0,
    communication_skills: 0,
    problem_solving: 0,
    soft_skills: 0,
    code_quality: 0,
    overall_performance: 0,
  });

  const [codingPerformance, setCodingPerformance] = useState({
    total_submissions: 0,
    logical_thinking: 0,
    code_efficiency: 0,
    language_skills: 0,
    problem_solving: 0,
    overall_score: 0,
  });

  const [aiIntelligence, setAiIntelligence] = useState({
    overall_readiness: 0,
    metrics: {
      quiz_mastery: 0,
      coding_ability: 0,
      interview_skill: 0,
    },
  });

  const [performanceData, setPerformanceData] = useState([
    { day: "Mon", quiz: 50, coding: 40, interview: 70 },
    { day: "Tue", quiz: 58, coding: 48, interview: 70 },
    { day: "Wed", quiz: 65, coding: 56, interview: 70 },
    { day: "Thu", quiz: 72, coding: 64, interview: 70 },
    { day: "Fri", quiz: 80, coding: 74, interview: 70 },
    { day: "Sat", quiz: 86, coding: 82, interview: 70 },
    { day: "Sun", quiz: 92, coding: 88, interview: 70 },
  ]);

  useEffect(() => {
    const fetchQuizPerformance = async () => {
      try {
        const res = await api.get("/quiz/performance/");
        if (res.data) {
          setQuizPerformance(res.data);
        }
      } catch (err) {
        console.warn("Quiz API Error:", err);
      }
    };

    const fetchInterviewPerformance = async () => {
      try {
        const res = await api.get("/interview/performance/");
        if (res.data) {
          setInterviewPerformance(res.data);
        }
      } catch (err) {
        console.warn("Interview Performance API Error:", err);
      }
    };

    const fetchCodingPerformance = async () => {
      try {
        const res = await api.get("/coding/performance/");
        if (res.data) {
          setCodingPerformance(res.data);
        }
      } catch (err) {
        console.warn("Coding Performance API Error:", err);
      }
    };

    const fetchAiIntelligence = async () => {
      try {
        const res = await api.get("/dashboard/ai-intelligence/");
        if (res.data && res.data.metrics) {
          setAiIntelligence(res.data);
        }
      } catch (err) {
        console.warn("AI Intelligence API Error:", err);
      }
    };

    fetchQuizPerformance();
    fetchInterviewPerformance();
    fetchCodingPerformance();
    fetchAiIntelligence();
  }, []);

  // Synchronize AI Profile Intelligence metrics live whenever Candidate Task results update
  useEffect(() => {
    const qScore = quizPerformance.overall_score || 0;
    const cScore = codingPerformance.overall_score || 0;
    const iScore = interviewPerformance.overall_performance || 0;

    const scoresMap = [
      { name: "Quiz", score: qScore },
      { name: "Coding", score: cScore },
      { name: "Interview", score: iScore },
    ];

    const activeScores = scoresMap.filter((s) => s.score > 0);
    const overallReadiness =
      activeScores.length > 0
        ? Math.round(activeScores.reduce((acc, curr) => acc + curr.score, 0) / activeScores.length)
        : 0;

    setAiIntelligence({
      overall_readiness: overallReadiness,
      metrics: {
        quiz_mastery: qScore,
        coding_ability: cScore,
        interview_skill: iScore,
      },
    });
  }, [quizPerformance.overall_score, codingPerformance.overall_score, interviewPerformance.overall_performance]);

  // Day-wise performance data calculation & backend API integration
  useEffect(() => {
    const fetchDailyProgress = async () => {
      try {
        const res = await api.get("/dashboard/daily-progress/");
        if (res.data && res.data.daily_progress && res.data.daily_progress.length > 0) {
          setPerformanceData(res.data.daily_progress);
          return;
        }
      } catch (err) {
        console.warn("Daily Progress API Error:", err);
      }

      // Dynamic day-wise calculation based on overall candidate performance
      const qScore = quizPerformance.overall_score || 0;
      const cScore = codingPerformance.overall_score || 0;
      const iScore = interviewPerformance.overall_performance || 0;
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const computed = days.map((dayName, index) => {
        const progressFactor = 0.65 + 0.35 * ((index + 1) / 7);
        return {
          day: dayName,
          quiz: qScore > 0 ? Math.min(100, Math.round(qScore * progressFactor)) : 0,
          coding: cScore > 0 ? Math.min(100, Math.round(cScore * progressFactor)) : 0,
          interview: iScore > 0 ? Math.min(100, Math.round(iScore * progressFactor)) : 0,
        };
      });
      setPerformanceData(computed);
    };

    fetchDailyProgress();
  }, [quizPerformance.overall_score, codingPerformance.overall_score, interviewPerformance.overall_performance]);

  const showQuiz = activeMetric === "all" || activeMetric === "quiz";
  const showCoding = activeMetric === "all" || activeMetric === "coding";
  const showInterview = activeMetric === "all" || activeMetric === "interview";

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>
          Welcome Back, <span className="username">{user.username}</span>
        </h1>
        <h2>PrepMaster AI Dashboard</h2>
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
              <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "14px" }}>
                Candidate daily progress tracking & skill trends
              </p>
            </div>

            {/* Interactive Filter Pills */}
            <div className="chart-filter-pills">
              <button
                className={`filter-pill ${activeMetric === "all" ? "active" : ""}`}
                onClick={() => setActiveMetric("all")}
              >
                All Metrics
              </button>
              <button
                className={`filter-pill quiz-pill ${activeMetric === "quiz" ? "active" : ""}`}
                onClick={() => setActiveMetric("quiz")}
              >
                Quiz
              </button>
              <button
                className={`filter-pill coding-pill ${activeMetric === "coding" ? "active" : ""}`}
                onClick={() => setActiveMetric("coding")}
              >
                Coding
              </button>
              <button
                className={`filter-pill interview-pill ${activeMetric === "interview" ? "active" : ""}`}
                onClick={() => setActiveMetric("interview")}
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

              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
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

        {/* AI Profile Intelligence */}
        <div className="overall-card">
          <div className="ai-profile-header">
            <h3>🤖 AI Profile Intelligence</h3>
            <p>Smart Candidate Performance Analysis</p>
          </div>

          {/* Ultra-Attractive Circular SVG Gauge */}
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
                strokeDashoffset={314.159 - (314.159 * aiIntelligence.overall_readiness) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-center-text">
              <span className="gauge-score-num">{aiIntelligence.overall_readiness}%</span>
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
                {aiIntelligence.metrics.quiz_mastery > 0 && (
                  <span className={`metric-status-badge ${
                    aiIntelligence.metrics.quiz_mastery >= 85 ? "tag-excellent" :
                    aiIntelligence.metrics.quiz_mastery >= 50 ? "tag-good" : "tag-practice"
                  }`}>
                    {aiIntelligence.metrics.quiz_mastery >= 85 ? "Excellent" :
                     aiIntelligence.metrics.quiz_mastery >= 50 ? "Good" : "Needs Practice"}
                  </span>
                )}
                <div className="score-pill-chip quiz-score-chip">
                  {aiIntelligence.metrics.quiz_mastery}%
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
                {aiIntelligence.metrics.coding_ability > 0 && (
                  <span className={`metric-status-badge ${
                    aiIntelligence.metrics.coding_ability >= 85 ? "tag-excellent" :
                    aiIntelligence.metrics.coding_ability >= 50 ? "tag-good" : "tag-practice"
                  }`}>
                    {aiIntelligence.metrics.coding_ability >= 85 ? "Excellent" :
                     aiIntelligence.metrics.coding_ability >= 50 ? "Good" : "Needs Practice"}
                  </span>
                )}
                <div className="score-pill-chip coding-score-chip">
                  {aiIntelligence.metrics.coding_ability}%
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
                  <span className="metric-subtitle">Communication & AI Mock</span>
                </div>
              </div>
              <div className="metric-info-right">
                {aiIntelligence.metrics.interview_skill > 0 && (
                  <span className={`metric-status-badge ${
                    aiIntelligence.metrics.interview_skill >= 85 ? "tag-excellent" :
                    aiIntelligence.metrics.interview_skill >= 50 ? "tag-good" : "tag-practice"
                  }`}>
                    {aiIntelligence.metrics.interview_skill >= 85 ? "Excellent" :
                     aiIntelligence.metrics.interview_skill >= 50 ? "Good" : "Needs Practice"}
                  </span>
                )}
                <div className="score-pill-chip interview-score-chip">
                  {aiIntelligence.metrics.interview_skill}%
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