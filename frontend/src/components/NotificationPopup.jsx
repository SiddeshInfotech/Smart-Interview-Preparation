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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef(null);

  // ===========================
  // Fetch Notifications
  // ===========================
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const res = await api.get("/notifications/");

      setNotifications(
        Array.isArray(res.data.data) ? res.data.data : []
      );
    } catch (err) {
      console.error("Notification Fetch Error:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

  fetchNotifications();

  const updateNotification = () => {
    fetchNotifications();
  };

  window.addEventListener(
    "notificationUpdate",
    updateNotification
  );


  return () => {
    window.removeEventListener(
      "notificationUpdate",
      updateNotification
    );
  };

}, []);

  // ===========================
  // Close Popup Outside Click
  // ===========================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // ===========================
  // Unread Count
  // ===========================
  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  // ===========================
  // Filter Tabs
  // ===========================
  const filtered = notifications.filter((n) => {
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
  // Mark One Notification Read
  // ===========================
  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`, {
        notification_id: id,
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ===========================
  // Mark All Read
  // ===========================
  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all/");

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptRequest = async (n) => {
    const match = n.message.match(/Schedule ID:\s*(\d+)/);
    if (!match) return;
    const scheduleId = match[1];
    try {
      await api.post(`/interview/schedule/${scheduleId}/accept/`);
      alert("Interview request accepted and scheduled!");
      await markAsRead(n.notification_id);
    } catch (err) {
      console.error(err);
      alert("Failed to accept request.");
    }
  };

  const handleDeclineRequest = async (n) => {
    const match = n.message.match(/Schedule ID:\s*(\d+)/);
    if (!match) return;
    const scheduleId = match[1];
    try {
      await api.post(`/interview/schedule/${scheduleId}/decline/`);
      alert("Interview request declined.");
      await markAsRead(n.notification_id);
    } catch (err) {
      console.error(err);
      alert("Failed to decline request.");
    }
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        className="icon-btn notif-bell-btn"
        onClick={() => setOpen(!open)}
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

            <button
              className="notif-mark-all"
              onClick={markAllAsRead}
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>

          {/* Tabs */}

          <div className="notif-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`notif-tab ${
                  activeTab === tab
                    ? "notif-tab--active"
                    : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}

                {tab === "Unread" &&
                  unreadCount > 0 && (
                    <span className="notif-tab__count">
                      {unreadCount}
                    </span>
                  )}
              </button>
            ))}
          </div>

          {/* Notification List */}

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">
                Loading notifications...
              </div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <Bell size={22} />
                <p>No notifications found</p>
              </div>
            ) : (
              filtered.map((n) => {
                const Icon =
                  TYPE_ICON[n.notification_type] ||
                  Bell;

                return (
                  <button
                    key={n.notification_id}
                    className={`notif-item ${
                      !n.is_read
                        ? "notif-item--unread"
                        : ""
                    }`}
                    onClick={() =>
                      markAsRead(
                        n.notification_id
                      )
                    }
                  >
                    <span
                      className={`notif-item__icon notif-item__icon--${n.notification_type}`}
                    >
                      <Icon size={16} />
                    </span>

                    <span className="notif-item__body">
                      <span className="notif-item__title">
                        {n.title}
                      </span>

                      <span className="notif-item__desc">
                        {n.message}
                      </span>

                      {n.notification_type === "interview" && n.title === "New Interview Request" && n.message.includes("Schedule ID:") && (
                        <div className="notif-actions" style={{ display: "flex", gap: "8px", marginTop: "8px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn--success btn--xs"
                            style={{ padding: "4px 8px", fontSize: "11px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                            onClick={() => handleAcceptRequest(n)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn--danger btn--xs"
                            style={{ padding: "4px 8px", fontSize: "11px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                            onClick={() => handleDeclineRequest(n)}
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      <span className="notif-item__time" style={{ marginTop: "6px", display: "block" }}>
                        {new Date(
                          n.created_at
                        ).toLocaleString()}
                      </span>
                    </span>

                    {!n.is_read && (
                      <span className="notif-item__unread-dot" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}