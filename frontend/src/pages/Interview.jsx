import React, { useState, useEffect } from "react";
import { CalendarDays, Video } from "lucide-react";
import InterviewSchedule from "./InterviewSchedule.jsx";
import InterviewPage from "./InterviewPage.jsx";
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

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    // Optionally fetch interviews from API here
  }, []);

  const handleSchedule = (newInterview) => {
    setInterviews((prev) => [newInterview, ...prev]);
    setActiveTab("schedule");
  };

  const handleSelectInterview = (interview) => {
    setSelectedInterview(interview);
    setActiveTab("lobby");
  };

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
                // When you have real scheduling, use selectedInterview?.roomName
                roomName={"room_101"}
                identity={identity}               // ✅ unique ID
                participantName={participantName} // display name
                role={role}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}