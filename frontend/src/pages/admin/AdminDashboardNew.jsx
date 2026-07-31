import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardStats } from "../../api/adminApiDynamic";

/**
 * AdminDashboardNew — Modern dashboard with system metrics, auto-generated stat cards,
 * recent audit log activity feed, and quick model navigation grid.
 */

// Model icon mapping
const MODEL_ICONS = {
  user: "👥",
  candidate_profile: "🎓",
  interviewer_profile: "🧑‍💼",
  intervieweravailability: "⏰",
  interviewschedule: "📅",
  feedback: "⭐",
  skill: "💡",
  resume: "📄",
  resumeanalysis: "🔍",
  notification: "🔔",
  otpverification: "🔐",
  interviewfeedbackreview: "📝",
  codingsubmission: "💻",
  codingquestion: "❓",
  quizperformance: "📊",
  usercredit: "💳",
};

const STAT_CARD_COLORS = ["blue", "green", "purple", "cyan", "orange", "red"];

export default function AdminDashboardNew() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats()
      .then((res) => setStats(res.data?.data || null))
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div className="admin-skeleton admin-skeleton--title" style={{ marginBottom: 6 }} />
          <div className="admin-skeleton admin-skeleton--text" style={{ width: "40%" }} />
        </div>
        <div className="admin-stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="admin-skeleton admin-skeleton--card" style={{ height: 100 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-empty">
        <h4>Error loading dashboard</h4>
        <p>{error}</p>
      </div>
    );
  }

  const modelCounts = stats?.model_counts ? Object.values(stats.model_counts) : [];
  const recentActions = stats?.recent_actions || [];

  return (
    <div>
      {/* ── Section Header ─────────────────────────── */}
      <div className="admin-section-header">
        <div>
          <h2>System Overview</h2>
          <p>Real-time analytics and registered database metrics across all modules.</p>
        </div>
      </div>

      {/* ── Key Metrics Grid ────────────────────────── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card admin-stat-card--blue">
          <div className="admin-stat-card__icon">👥</div>
          <div className="admin-stat-card__value">{stats?.total_users ?? 0}</div>
          <div className="admin-stat-card__label">Total Registered Users</div>
        </div>

        <div className="admin-stat-card admin-stat-card--green">
          <div className="admin-stat-card__icon">⚡</div>
          <div className="admin-stat-card__value">{stats?.active_users ?? 0}</div>
          <div className="admin-stat-card__label">Active Accounts</div>
        </div>

        <div className="admin-stat-card admin-stat-card--purple">
          <div className="admin-stat-card__icon">📈</div>
          <div className="admin-stat-card__value">{stats?.new_users_30d ?? 0}</div>
          <div className="admin-stat-card__label">New Users (Last 30 Days)</div>
        </div>

        <div className="admin-stat-card admin-stat-card--cyan">
          <div className="admin-stat-card__icon">🛡️</div>
          <div className="admin-stat-card__value">{stats?.staff_users ?? 0}</div>
          <div className="admin-stat-card__label">Admin / Staff Users</div>
        </div>
      </div>

      {/* ── Model Counts Grid ───────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--admin-ink)" }}>
          Registered Models Metrics
        </h3>
        <div className="admin-stats-grid">
          {modelCounts.map((mc, idx) => {
            const icon = MODEL_ICONS[mc.model_name] || "📁";
            const colorClass = STAT_CARD_COLORS[idx % STAT_CARD_COLORS.length];
            return (
              <div
                key={`${mc.app_label}-${mc.model_name}`}
                className={`admin-stat-card admin-stat-card--${colorClass} admin-stat-card--clickable`}
                onClick={() => navigate(`/my_admin_panel/${mc.app_label}/${mc.model_name}`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="admin-stat-card__icon">{icon}</div>
                  <span style={{ fontSize: 11, color: "var(--admin-ink-muted)" }}>{mc.app_label}</span>
                </div>
                <div className="admin-stat-card__value">{mc.count}</div>
                <div className="admin-stat-card__label">{mc.verbose_name_plural}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dashboard Grid (Recent Activity & Quick Links) ── */}
      <div className="admin-dashboard-grid">
        {/* Recent Audit Log Activity */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__title">Recent Audit Log</div>
            <span style={{ fontSize: 11, color: "var(--admin-ink-muted)" }}>System Actions</span>
          </div>
          <div className="admin-dashboard-card__body">
            {!recentActions.length ? (
              <div style={{ fontSize: 13, color: "var(--admin-ink-muted)", padding: "12px 0" }}>
                No recent activity logged.
              </div>
            ) : (
              <div>
                {recentActions.map((act) => (
                  <div key={act.id} className="admin-activity-item">
                    <div className={`admin-activity-dot admin-activity-dot--${act.action}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="admin-activity-text">
                        <strong>{act.user}</strong> {act.action.toLowerCase()}{" "}
                        <span style={{ fontWeight: 600 }}>{act.model_name}</span>: {act.object_repr}
                      </div>
                      <div className="admin-activity-time">
                        {new Date(act.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__title">Quick Model Navigation</div>
            <span style={{ fontSize: 11, color: "var(--admin-ink-muted)" }}>Direct Access</span>
          </div>
          <div className="admin-dashboard-card__body">
            <div className="admin-quick-grid">
              {modelCounts.slice(0, 8).map((mc) => {
                const icon = MODEL_ICONS[mc.model_name] || "📁";
                return (
                  <button
                    key={`${mc.app_label}-${mc.model_name}`}
                    className="admin-quick-link"
                    onClick={() => navigate(`/my_admin_panel/${mc.app_label}/${mc.model_name}`)}
                  >
                    <span className="admin-quick-link__icon">{icon}</span>
                    <span>{mc.verbose_name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
