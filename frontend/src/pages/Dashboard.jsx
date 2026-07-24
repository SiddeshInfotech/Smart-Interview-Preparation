import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { BookOpen, Code, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [fullName, setFullName] = useState(() => {
    return userProfile?.name && userProfile.name !== "User" ? userProfile.name : "User";
  });

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
    overallPerformance: 92,
  };

  const [quizPerformance, setQuizPerformance] = useState({
    total_quizzes: 0,
    minimum_score: 0,
    maximum_score: 0,
    average_score: 0,
    overall_score: 0,
  });

  useEffect(() => {

    const token = localStorage.getItem("access_token");
    fetch("http://127.0.0.1:8000/api/quiz/performance/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch quiz performance");
        }
        return response.json();
      })
      .then((data) => {
        setQuizPerformance(data);
      })
      .catch((error) => {
        console.log("Quiz API Error:", error);
      });
  }, []);

  const performanceData = [
    { month: "Jan", quiz: 45, coding: 35, interview: 25 },
    { month: "Feb", quiz: 58, coding: 44, interview: 33 },
    { month: "Mar", quiz: 69, coding: 53, interview: 40 },
    { month: "Apr", quiz: 77, coding: 64, interview: 55 },
    { month: "May", quiz: 88, coding: 76, interview: 70 },
    { month: "Jun", quiz: 97, coding: 89, interview: 83 },
  ];

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
        {/* Performance Analytics Graph */}
        <div className="graph-card">
          <div className="card-header">
            <h3>Performance Analytics</h3>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="quiz"
                stroke="#2563EB"
                strokeWidth={3}
                fill="#2563EB"
                fillOpacity={0.20}
                name="Quiz"
              />
              <Area
                type="monotone"
                dataKey="coding"
                stroke="#10B981"
                strokeWidth={3}
                fill="#10B981"
                fillOpacity={0.20}
                name="Coding"
              />
              <Area
                type="monotone"
                dataKey="interview"
                stroke="#7C3AED"
                strokeWidth={3}
                fill="#7C3AED"
                fillOpacity={0.20}
                name="Interview"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Profile Intelligence */}
        <div className="overall-card">
          <div className="ai-profile-header">
            <h3>🤖 AI Profile Intelligence</h3>
            <p>Smart Candidate Analysis</p>
          </div>

          <div className="main-readiness-score">
            <h1>{user.overallPerformance}%</h1>
            <span>Overall Readiness</span>
          </div>

          <div className="ai-status-box">
            <div className="status-card">
              <strong>Strong</strong>
              <span>Skills</span>
            </div>
            <div className="status-card">
              <strong>Ready</strong>
              <span>Status</span>
            </div>
          </div>

          <div className="ai-metrics">
            <div className="metric-row">
              <span>Resume Quality</span>
              <strong>95%</strong>
            </div>
            <div className="metric-row">
              <span>Coding Ability</span>
              <strong>90%</strong>
            </div>
            <div className="metric-row">
              <span>Interview Skill</span>
              <strong>90%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="performance-section">
        {/* Quiz Performance */}
        <div className="performance-card">
          <div className="performance-title">
            <div className="category-badge quiz-badge">
              <BookOpen size={22} color="#ffffff" />
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
        <div className="performance-card">
          <div className="performance-title">
            <div className="category-badge coding-badge">
              <Code size={22} color="#ffffff" />
            </div>
            <h3>Coding Performance</h3>
          </div>

          <div className="performance-content">
            <div className="performance-row">
              <span>Logical Thinking</span>
              <strong>94%</strong>
            </div>
            <div className="performance-row">
              <span>Code Efficiency</span>
              <strong>89%</strong>
            </div>
            <div className="performance-row">
              <span>Language Skills</span>
              <strong>86%</strong>
            </div>
            <div className="performance-row">
              <span>Problem Solving</span>
              <strong>91%</strong>
            </div>

            <hr className="performance-divider" />

            <div className="performance-row total-performance">
              <span>Overall Coding Performance</span>
              <strong className="performance-score">90%</strong>
            </div>
          </div>
        </div>

        {/* Interview Performance */}
        <div className="performance-card">
          <div className="performance-title">
            <div className="category-badge interview-badge">
              <Video size={22} color="#ffffff" />
            </div>
            <h3>Interview Performance</h3>
          </div>

          <div className="performance-content">
            <div className="performance-row">
              <span>Confidence</span>
              <strong>92%</strong>
            </div>
            <div className="performance-row">
              <span>Communication Skills</span>
              <strong>89%</strong>
            </div>
            <div className="performance-row">
              <span>Decision Making</span>
              <strong>87%</strong>
            </div>
            <div className="performance-row">
              <span>Problem Solving</span>
              <strong>90%</strong>
            </div>

            <hr className="performance-divider" />

            <div className="performance-row total-performance">
              <span>Overall Interview Performance</span>
              <strong className="performance-score">90%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;