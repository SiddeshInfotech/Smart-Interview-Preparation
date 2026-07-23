import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats } from "../../api/adminApi";

const STAT_CARDS = [
  { key: "total_users",        label: "Total Users",        emoji: "👥", accent: "blue"   },
  { key: "total_candidates",   label: "Candidates",         emoji: "🎓", accent: "green"  },
  { key: "total_interviewers", label: "Interviewers",       emoji: "🧑‍💼", accent: "purple" },
  { key: "total_questions",    label: "Questions",          emoji: "📚", accent: "orange" },
  { key: "total_interviews",   label: "Interview Schedules",emoji: "📅", accent: "blue"   },
  { key: "total_sessions",     label: "Sessions",           emoji: "🎥", accent: "cyan"   },
  { key: "total_resumes",      label: "Resumes",            emoji: "📄", accent: "green"  },
  { key: "total_notifications",label: "Notifications",      emoji: "🔔", accent: "orange" },
  { key: "total_submissions",  label: "Submissions",        emoji: "💻", accent: "red"    },
];

const QUICK_LINKS = [
  { label: "Manage Users",     path: "/my_admin_panel/users",       emoji: "👥" },
  { label: "Question Bank",    path: "/my_admin_panel/questions",   emoji: "📚" },
  { label: "Interviews",       path: "/my_admin_panel/interviews",  emoji: "📅" },
  { label: "Resumes",          path: "/my_admin_panel/resumes",     emoji: "📄" },
  { label: "Analytics",        path: "/my_admin_panel/analytics",   emoji: "📊" },
  { label: "OTP Records",      path: "/my_admin_panel/otps",        emoji: "🔐" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data?.data || {}))
      .catch(() => setError("Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="admin-section-header" style={{ marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Welcome back, Admin 👋</h2>
          <p style={{ marginTop: "4px" }}>Here's a live overview of the platform.</p>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="admin-spinner"><div className="admin-spinner__ring" /></div>
      ) : error ? (
        <div style={{ color: "#dc2626", padding: "16px", background: "#fef2f2", borderRadius: "10px", marginBottom: "24px" }}>
          {error}
        </div>
      ) : (
        <div className="admin-stats-grid">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className={`admin-stat-card admin-stat-card--${card.accent}`}>
              <div className="admin-stat-card__icon">{card.emoji}</div>
              <div className="admin-stat-card__value">
                {stats?.[card.key] ?? "—"}
              </div>
              <div className="admin-stat-card__label">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div style={{ marginTop: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px" }}>
          Quick Access
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
          {QUICK_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px 14px",
                textAlign: "center",
                cursor: "pointer",
                transition: "box-shadow 0.2s, transform 0.2s",
                fontSize: "13.5px",
                fontWeight: "600",
                color: "#1a2332",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "24px" }}>{link.emoji}</span>
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
