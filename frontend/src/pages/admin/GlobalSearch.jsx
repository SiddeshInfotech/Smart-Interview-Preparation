import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * GlobalSearch — Command Palette (Ctrl+K / Cmd+K)
 * Allows rapid keyboard search & navigation across all registered Django models.
 */

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

export default function GlobalSearch({ modelsGrouped, isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Flatten all models from groups
  const allModels = React.useMemo(() => {
    if (!modelsGrouped) return [];
    const flat = [];
    modelsGrouped.forEach((group) => {
      group.models.forEach((m) => {
        flat.push({
          ...m,
          groupName: group.display_name,
        });
      });
    });
    return flat;
  }, [modelsGrouped]);

  // Filter models based on query
  const filtered = React.useMemo(() => {
    if (!query.trim()) return allModels;
    const q = query.toLowerCase();
    return allModels.filter(
      (m) =>
        m.verbose_name.toLowerCase().includes(q) ||
        m.verbose_name_plural.toLowerCase().includes(q) ||
        m.model_name.toLowerCase().includes(q) ||
        m.app_label.toLowerCase().includes(q) ||
        m.groupName.toLowerCase().includes(q)
    );
  }, [allModels, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global hotkey listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open trigger event or callback
          const btn = document.getElementById("admin-global-search-btn");
          if (btn) btn.click();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (model) => {
    navigate(`/my_admin_panel/${model.app_label}/${model.model_name}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="admin-cmd-overlay" onClick={onClose}>
      <div className="admin-cmd-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="admin-cmd-input"
          placeholder="Search models, apps, or features... (ESC to close)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        <div className="admin-cmd-results">
          {!filtered.length ? (
            <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--admin-ink-muted)", fontSize: 13 }}>
              No matching models found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const icon = MODEL_ICONS[item.model_name] || "📁";
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.app_label}-${item.model_name}`}
                  className={`admin-cmd-item ${isSelected ? "highlighted" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="admin-cmd-item__icon">{icon}</div>
                  <div className="admin-cmd-item__info">
                    <div className="admin-cmd-item__name">{item.verbose_name_plural}</div>
                    <div className="admin-cmd-item__app">
                      {item.groupName} • {item.app_label}.{item.model_name}
                    </div>
                  </div>
                  <div className="admin-cmd-item__count">{item.count ?? 0} records</div>
                </div>
              );
            })
          )}
        </div>

        <div className="admin-cmd-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
          <span><kbd>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
