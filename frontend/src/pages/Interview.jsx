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

  // ---- Fetch user profile ----
  useEffect(() => {
    const fetchUser = async () => {
      let currentUser = getCurrentUser();
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
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  // ---- Fetch interviews from backend ----
  const fetchInterviews = async () => {
    if (!user) return;
    try {
      const res = await api.get("/interview/my-interviews/");
      // The endpoint might return paginated data; adjust accordingly.
      const data = res.data.results || res.data || [];
      const transformed = data.map((item) => ({
        id: item.schedule_id,
        interviewer: item.interviewer_name || "Interviewer",
        candidate: item.candidate_name || "Candidate",
        date: item.scheduled_date,
        time: item.scheduled_time,
        type: "Interview", // can be extended later
        status: item.status || "Scheduled",
        roomName: item.room_name,
        meeting_link: item.meeting_link,
        // Keep original data if needed
        ...item,
      }));
      setInterviews(transformed);
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
    }
  };

  // ---- Poll for updates (optional, every 15 seconds) ----
  useEffect(() => {
    if (!user) return;
    fetchInterviews();
    const interval = setInterval(fetchInterviews, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // ---- Handle new interview (from scheduling form) ----
  const handleSchedule = (newInterview) => {
    // Transform the backend response (from the form) to frontend format
    const transformed = {
      id: newInterview.schedule_id,
      interviewer: newInterview.interviewer_name || "Interviewer",
      candidate: user?.full_name || "Candidate",
      date: newInterview.scheduled_date,
      time: newInterview.scheduled_time,
      type: "Interview",
      status: newInterview.status || "Scheduled",
      roomName: newInterview.room_name,
      meeting_link: newInterview.meeting_link,
    };
    setInterviews((prev) => [transformed, ...prev]);
    setActiveTab("schedule");
  };

  // ---- Handle selecting an interview to join ----
  const handleSelectInterview = (interview) => {
    setSelectedInterview(interview);
    setActiveTab("lobby");
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  // ---- LiveKit identity from user ----
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
                roomName={selectedInterview?.roomName || "room_101"}
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