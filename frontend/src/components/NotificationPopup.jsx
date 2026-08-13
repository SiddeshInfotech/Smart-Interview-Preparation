import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  FileText,
  Award,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import api from "../api/axios";
import "../styles/ToastNotification.css";

import { useAuth } from "../context/AuthContext";

const TABS = ["All", "Unread", "Read", "System"];

const TYPE_ICON = {
  system: AlertCircle,
  resume: FileText,
  interview: MessageSquare,
  feedback: Award,
  assessment: Award,
};

export default function NotificationPopup() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const wrapperRef = useRef(null);

  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);

  const {
    notifications = [],
    unreadCount = 0,
    loadingNotifications: loading = false,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useAuth();

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const filtered = safeNotifications.filter((n) => {
    switch (activeTab) {
      case "Unread":
        return !n.is_read;
      case "Read":
        return n.is_read;
      case "System":
        return n.notification_type === "system";
      default:
        return true;
    }
  });

  // ===========================
  // Accept Interview Request
  // ===========================
  const handleAcceptRequest = async (n) => {
    const match = n.message.match(/Schedule ID:\s*(\d+)/);
    if (!match) {
      console.error("Could not find Schedule ID in message");
      return;
    }
    const scheduleId = match[1];
    setAcceptingId(scheduleId);
    try {
      await api.post(`/interview/accept/${scheduleId}/`);
      await markAsRead(n.notification_id);
      fetchNotifications();
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to accept request.");
    } finally {
      setAcceptingId(null);
    }
  };

  // ===========================
  // Decline Interview Request
  // ===========================
  const handleDeclineRequest = async (n) => {
    const match = n.message.match(/Schedule ID:\s*(\d+)/);
    if (!match) {
      console.error("Could not find Schedule ID in message");
      return;
    }
    const scheduleId = match[1];
    setDecliningId(scheduleId);
    try {
      await api.post(`/interview/decline/${scheduleId}/`);
      await markAsRead(n.notification_id);
      fetchNotifications();
    } catch (err) {
      console.error("Decline error:", err);
      alert("Failed to decline request.");
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        className="icon-btn notif-bell-btn"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          {/* Header */}
          <div className="notif-panel__header">
            <h4>Notifications</h4>
            <button className="notif-mark-all" onClick={markAllAsRead}>
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>

          {/* Tabs */}
          <div className="notif-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`notif-tab ${activeTab === tab ? "notif-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === "Unread" && unreadCount > 0 && (
                  <span className="notif-tab__count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading notifications...</div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <Bell size={22} />
                <p>No notifications found</p>
              </div>
            ) : (
              filtered.map((n) => {
                const Icon = TYPE_ICON[n.notification_type] || Bell;

                // Determine if this notification is an interview request
                const isInterviewRequest =
                  n.notification_type === "interview" &&
                  n.title === "New Interview Request" &&
                  n.message.includes("Schedule ID:");

                return (
                  <div
                    key={n.notification_id}
                    className={`notif-item ${!n.is_read ? "notif-item--unread" : ""}`}
                    onClick={() => { if (!n.is_read) markAsRead(n.notification_id); }}
                  >
                    <span
                      className={`notif-item__icon notif-item__icon--${n.notification_type}`}
                    >
                      <Icon size={16} />
                    </span>

                    <span className="notif-item__body">
                      <span className="notif-item__title">{n.title}</span>
                      <span className="notif-item__desc">{n.message}</span>

                      {isInterviewRequest && (() => {
                        const match = n.message.match(/Schedule ID:\s*(\d+)/);
                        const schedId = match ? match[1] : null;
                        const isAccepting = acceptingId === schedId;
                        const isDeclining = decliningId === schedId;

                        return (
                          <div
                            className="notif-actions"
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                            onClick={(e) => e.stopPropagation()} // prevent marking as read
                          >
                            <button
                              className="btn btn--success btn--xs"
                              disabled={isAccepting || isDeclining}
                              style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                background: isAccepting ? "#059669" : "#10b981",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isAccepting || isDeclining ? "wait" : "pointer",
                                fontWeight: "600",
                                opacity: isAccepting || isDeclining ? 0.8 : 1,
                              }}
                              onClick={() => handleAcceptRequest(n)}
                            >
                              {isAccepting ? "Accepting..." : "Accept"}
                            </button>
                            <button
                              className="btn btn--danger btn--xs"
                              disabled={isAccepting || isDeclining}
                              style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                background: isDeclining ? "#dc2626" : "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isAccepting || isDeclining ? "wait" : "pointer",
                                fontWeight: "600",
                                opacity: isAccepting || isDeclining ? 0.8 : 1,
                              }}
                              onClick={() => handleDeclineRequest(n)}
                            >
                              {isDeclining ? "Declining..." : "Decline"}
                            </button>
                          </div>
                        );
                      })()}

                      <span
                        className="notif-item__time"
                        style={{ marginTop: "6px", display: "block" }}
                      >
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </span>

                    {!n.is_read && <span className="notif-item__unread-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}