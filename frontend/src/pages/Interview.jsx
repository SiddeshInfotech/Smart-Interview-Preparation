import React, { useState } from "react";
import { CalendarDays, Video } from "lucide-react";
import PageNavbar from "../components/PageNavbar.jsx";
import InterviewSchedule from "./InterviewSchedule.jsx";
import InterviewPage from "./InterviewPage.jsx";
import "../styles/Interview.css";

export default function Interview() {
  const [activeTab, setActiveTab] = useState("schedule"); // "schedule" | "lobby"

  return (
    <div className="interview-dashboard">
      <PageNavbar activePath="/interview" />

      <div className="dashboard-page-container">
        <main className="dashboard-content-wrapper">
          {/* Header */}
          <header className="content-header-simple">
            <h2>Mock Interviews & Preparation</h2>
            <p className="welcome-text">
              Schedule new practice sessions or join your live interview lobby.
            </p>
          </header>

          {/* Unified Tab System */}
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
              <InterviewSchedule standalone={true} />
            ) : (
              <InterviewPage standalone={true} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
