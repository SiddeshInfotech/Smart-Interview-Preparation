import React, { useState } from "react";
import { X, CheckCircle2, Layers, Loader2, Sparkles } from "lucide-react";
import "../styles/Courses.css";

export default function DomainSelectorModal({
  isOpen,
  onClose,
  domains = [],
  activeDomainId,
  onSelectDomain,
}) {
  const [switchingId, setSwitchingId] = useState(null);

  if (!isOpen) return null;

  const handleSelect = async (domainId) => {
    if (domainId === activeDomainId) {
      onClose();
      return;
    }
    setSwitchingId(domainId);
    try {
      await onSelectDomain(domainId);
    } catch (err) {
      console.error("Failed to switch domain:", err);
    } finally {
      setSwitchingId(null);
      onClose();
    }
  };

  return (
    <div className="domain-modal-overlay" onClick={onClose}>
      <div
        className="domain-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="domain-modal-header">
          <div>
            <h2>Select Preparation Domain</h2>
            <p>Choose a domain to access specialized courses and track learning progress.</p>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="domain-modal-list">
          {domains.map((dom) => {
            const isActive = dom.domain_id === activeDomainId;
            const isSwitching = switchingId === dom.domain_id;

            return (
              <div
                key={dom.domain_id}
                className={`domain-option-card ${isActive ? "active" : ""}`}
                onClick={() => !isSwitching && handleSelect(dom.domain_id)}
              >
                <div className="domain-option-left">
                  <div className="domain-icon-wrapper">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="domain-option-title">{dom.name}</h3>
                    <p className="domain-option-desc">{dom.description}</p>
                    <span className="domain-course-badge">
                      <Layers size={13} />
                      {dom.course_count || 0} Courses
                    </span>
                  </div>
                </div>

                <div className="domain-option-action">
                  {isSwitching ? (
                    <span className="switching-spinner">
                      <Loader2 size={18} className="spin" />
                      Switching...
                    </span>
                  ) : isActive ? (
                    <span className="active-badge">
                      <CheckCircle2 size={16} />
                      Active
                    </span>
                  ) : (
                    <button className="btn-select-domain">Select</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
