import React, { useState, useEffect } from "react";
import { CalendarDays, Video } from "lucide-react";
import InterviewSchedule from "./InterviewSchedule.jsx";
import InterviewPage from "./InterviewPage.jsx";
import api from "../api/axios";
import "../styles/Interview.css";

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export default function Interview() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      let currentUser = getCurrentUser();
      // If user exists but missing user_id, fetch fresh profile from backend
      if (currentUser && !currentUser.user_id) {
        try {
          const res = await api.get("/auth/profile/");
          const userData = res.data;
          if (userData && userData.user_id) {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }
      // If no user found or fetch failed, use the stored user (or null)
      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleSchedule = (newInterview) => {
    setInterviews((prev) => [newInterview, ...prev]);
    setActiveTab("schedule");
  };

  const handleSelectInterview = (interview) => {
    setSelectedInterview(interview);
    setActiveTab("lobby");
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  // Unique identity for LiveKit – must be unique per user
  const identity = user?.user_id || user?.email || "guest";
  const participantName = user?.full_name || "Guest";
  const role = user?.role || "candidate";

  return (
    <div className="interview-dashboard">
      <div className="dashboard-page-container">
        <main className="dashboard-content-wrapper">
          <header className="content-header-simple">
            <h2>Mock Interviews & Preparation</h2>
            <p className="welcome-text">
              Schedule new practice sessions or join your live interview lobby.
            </p>
          </header>

          <div className="interview-tabs-navigation">
            <button
              type="button"
              className={`interview-tab-btn ${activeTab === "schedule" ? "active" : ""}`}
              onClick={() => setActiveTab("schedule")}
            >
              <CalendarDays size={18} />
              <span>Scheduling & Management</span>
            </button>
            <button
              type="button"
              className={`interview-tab-btn ${activeTab === "lobby" ? "active" : ""}`}
              onClick={() => setActiveTab("lobby")}
            >
              <Video size={18} />
              <span>Live Interview Lobby</span>
            </button>
          </div>

          <div className="interview-tab-content">
            {activeTab === "schedule" ? (
              <InterviewSchedule
                standalone={true}
                interviews={interviews}
                onSchedule={handleSchedule}
                onSelectInterview={handleSelectInterview}
              />
            ) : (
              <InterviewPage
                standalone={true}
                roomName={"room_101"} // or selectedInterview?.roomName
                identity={identity}
                participantName={participantName}
                role={role}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}