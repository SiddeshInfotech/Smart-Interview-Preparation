import React, { useState, useEffect } from "react";
import { fetchHistory } from "../../api/adminApiDynamic";

/**
 * DynamicDetail — Rich detail view for a single record.
 * Shows all fields in a card layout with history timeline.
 */

function formatValue(value, field) {
  if (value === null || value === undefined || value === "") {
    return <span className="admin-detail-field__value--empty">Not set</span>;
  }

  const type = field?.type || "string";

  switch (type) {
    case "boolean":
      return (
        <span className={`admin-badge ${value ? "admin-badge--success" : "admin-badge--neutral"}`}>
          {value ? "Yes" : "No"}
        </span>
      );

    case "datetime":
      try {
        return new Date(value).toLocaleString("en-US", {
          month: "long", day: "numeric", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
      } catch { return String(value); }

    case "date":
      try {
        return new Date(value).toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        });
      } catch { return String(value); }

    case "email":
      return <a href={`mailto:${value}`} style={{ color: "var(--admin-primary)" }}>{value}</a>;

    case "url":
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "var(--admin-primary)", wordBreak: "break-all" }}>
          {value}
        </a>
      );

    case "image":
      if (typeof value === "string" && value) {
        return (
          <div>
            <img src={value} alt="" style={{
              maxWidth: 200, maxHeight: 200, borderRadius: 8,
              border: "1px solid var(--admin-border)", objectFit: "cover",
            }} />
            <div style={{ fontSize: 11, color: "var(--admin-ink-muted)", marginTop: 4 }}>{value}</div>
          </div>
        );
      }
      return String(value);

    case "json":
      try {
        const display = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
        return (
          <pre style={{
            fontFamily: "monospace", fontSize: 12, background: "var(--admin-bg-soft)",
            padding: 10, borderRadius: 6, overflow: "auto", maxHeight: 200,
            whiteSpace: "pre-wrap", margin: 0,
          }}>
            {display}
          </pre>
        );
      } catch { return String(value); }

    case "text":
      return <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{String(value)}</div>;

    default:
      return String(value);
  }
}


function HistoryTimeline({ appLabel, modelName, pk }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pk) return;
    setLoading(true);
    fetchHistory(appLabel, modelName, pk)
      .then((res) => setHistory(res.data?.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [appLabel, modelName, pk]);

  if (loading) {
    return (
      <div style={{ padding: "12px 0" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="admin-skeleton admin-skeleton--row" style={{ height: 36, marginBottom: 6 }} />
        ))}
      </div>
    );
  }

  if (!history.length) {
    return (
      <div style={{ padding: "16px 0", textAlign: "center", color: "var(--admin-ink-muted)", fontSize: 13 }}>
        No history records found.
      </div>
    );
  }

  return (
    <ul className="admin-history-list">
      {history.map((entry) => (
        <li key={entry.id} className="admin-history-item">
          <div className={`admin-history-dot admin-history-dot--${entry.action.toLowerCase()}`} />
          <div className="admin-history-content">
            <div className="admin-history-action">
              <strong>{entry.action}</strong> by {entry.user}
            </div>
            <div className="admin-history-meta">
              {new Date(entry.timestamp).toLocaleString()} — {entry.message || entry.object_repr}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}


export default function DynamicDetail({
  fields,
  record,
  appLabel,
  modelName,
  pkField = "id",
  onEdit,
  onClose,
}) {
  if (!record || !fields) {
    return (
      <div className="admin-empty">
        <p>No record data available.</p>
      </div>
    );
  }

  const pk = record[pkField];

  // Separate fields into groups
  const primaryFields = fields.filter((f) => {
    if (f.is_primary_key) return true;
    if (["string", "email", "integer", "float", "decimal", "boolean"].includes(f.type)) return true;
    if (f.choices) return true;
    if (["foreignkey", "onetoone"].includes(f.type)) return true;
    return false;
  });

  const dateFields = fields.filter((f) => ["date", "datetime", "time"].includes(f.type));
  const textFields = fields.filter((f) => ["text", "json"].includes(f.type));
  const urlFields = fields.filter((f) => ["url", "email", "image", "file"].includes(f.type) && !primaryFields.includes(f));

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--detail" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal__header">
          <div>
            <h3 style={{ margin: 0 }}>
              {modelName?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Detail
            </h3>
            <div style={{ fontSize: 11, color: "var(--admin-ink-muted)", marginTop: 2 }}>
              {appLabel} / {modelName} / {pk}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {onEdit && (
              <button className="admin-btn-outline" onClick={() => onEdit(record)} style={{ fontSize: 12, padding: "5px 12px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                Edit
              </button>
            )}
            <button className="admin-modal__close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="admin-modal__body" style={{ maxHeight: "70vh" }}>
          {/* Primary Fields */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Overview
            </h4>
            <div className="admin-detail-grid">
              {primaryFields.map((f) => {
                // Check if there's a display field for FK
                const displayKey = `${f.name}_display`;
                const displayValue = record[displayKey];

                return (
                  <div key={f.name} className="admin-detail-field">
                    <div className="admin-detail-field__label">{f.verbose_name}</div>
                    <div className="admin-detail-field__value">
                      {displayValue ? (
                        <span>
                          {displayValue}
                          <span style={{ fontSize: 11, color: "var(--admin-ink-muted)", marginLeft: 6 }}>
                            (ID: {record[f.name]})
                          </span>
                        </span>
                      ) : (
                        formatValue(record[f.name], f)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* URL / Link Fields */}
          {urlFields.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Links & Files
              </h4>
              <div className="admin-detail-grid">
                {urlFields.map((f) => (
                  <div key={f.name} className="admin-detail-field">
                    <div className="admin-detail-field__label">{f.verbose_name}</div>
                    <div className="admin-detail-field__value">
                      {formatValue(record[f.name], f)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text / JSON Fields */}
          {textFields.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Content
              </h4>
              {textFields.map((f) => (
                <div key={f.name} className="admin-detail-field admin-detail-field--full" style={{ marginBottom: 10 }}>
                  <div className="admin-detail-field__label">{f.verbose_name}</div>
                  <div className="admin-detail-field__value">
                    {formatValue(record[f.name], f)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timestamps */}
          {dateFields.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Timestamps
              </h4>
              <div className="admin-detail-grid">
                {dateFields.map((f) => (
                  <div key={f.name} className="admin-detail-field">
                    <div className="admin-detail-field__label">{f.verbose_name}</div>
                    <div className="admin-detail-field__value">
                      {formatValue(record[f.name], f)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              History
            </h4>
            <HistoryTimeline appLabel={appLabel} modelName={modelName} pk={pk} />
          </div>
        </div>
      </div>
    </div>
  );
}
