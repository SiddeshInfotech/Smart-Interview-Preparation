import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, FileText, Award, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../api/authAPI';
import '../styles/ToastNotification.css';

const TABS = ['All', 'Unread', 'Read', 'System'];

// Icon shown per notification "type" coming from the backend.
const TYPE_ICON = {
  system: AlertCircle,
  result: Award,
  message: MessageSquare,
  document: FileText,
};

export default function NotificationPopup() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/');
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Notifications fetch error', e);
        // Fallback sample data so the UI isn't empty during development.
        setNotifications([
          {
            id: 1,
            type: 'result',
            title: 'Mock interview scored',
            message: 'Your latest mock interview has been graded. Score: 82/100.',
            time: '10m ago',
            read: false,
          },
          {
            id: 2,
            type: 'document',
            title: 'Resume analysis ready',
            message: 'We finished analyzing your resume against the JD you uploaded.',
            time: '1h ago',
            read: false,
          },
          {
            id: 3,
            type: 'system',
            title: 'Scheduled maintenance',
            message: 'PrepMaster AI will be briefly unavailable tonight at 2 AM.',
            time: '3h ago',
            read: true,
          },
          {
            id: 4,
            type: 'message',
            title: 'New tip unlocked',
            message: 'Practice mode has a new question set for System Design.',
            time: '1d ago',
            read: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = Array.isArray(notifications)
  ? notifications.filter((n) => !n.read).length
  : 0;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.read;
    if (activeTab === 'Read') return n.read;
    if (activeTab === 'System') return n.type === 'system';
    return true;
  });

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await api.patch(`/notifications/${id}/`, { read: true });
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post('/notifications/mark-all-read/');
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        className="icon-btn notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <h4>Notifications</h4>
            <button className="notif-mark-all" onClick={markAllAsRead}>
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>

          <div className="notif-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`notif-tab ${activeTab === tab ? 'notif-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className="notif-tab__count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading notifications...</div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <Bell size={22} strokeWidth={1.5} />
                <p>Nothing here yet</p>
              </div>
            ) : (
              filtered.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <span className={`notif-item__icon notif-item__icon--${n.type}`}>
                      <Icon size={16} />
                    </span>
                    <span className="notif-item__body">
                      <span className="notif-item__title">{n.title}</span>
                      <span className="notif-item__desc">{n.message}</span>
                      <span className="notif-item__time">{n.time}</span>
                    </span>
                    {!n.read && <span className="notif-item__unread-dot" />}
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