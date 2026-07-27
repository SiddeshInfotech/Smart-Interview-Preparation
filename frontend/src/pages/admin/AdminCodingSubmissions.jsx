import React, { useState } from "react";
import { getCodingSubmissions, deleteCodingSubmission } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "id", label: "ID" },
  {
    key: "candidate_name",
    label: "Candidate",
    render: (v, r) => (
      <div>
        <strong>{v || "Anonymous"}</strong>
        <br />
        <small style={{ color: "#64748b" }}>{r.candidate_email || "N/A"}</small>
      </div>
    )
  },
  { key: "question_title_display", label: "Question / Task" },
  { key: "language", label: "Language", render: (v) => <span className="admin-badge admin-badge--purple">{v}</span> },
  {
    key: "status",
    label: "Status",
    render: (v) => (
      <span className={`admin-badge ${v === "Passed" || v === "success" ? "admin-badge--success" : "admin-badge--error"}`}>
        {v === "Passed" || v === "success" ? "✓ Passed" : "✕ Failed"}
      </span>
    )
  },
  { key: "score", label: "Score", render: (v) => <strong>{v}%</strong> },
  { key: "submitted_at", label: "Submitted", render: (v) => (v ? new Date(v).toLocaleString() : "—") }
];

export default function AdminCodingSubmissions() {
  const table = useAdminTable({
    fetchFn: getCodingSubmissions,
    deleteFn: deleteCodingSubmission,
    pkField: "id"
  });

  const [selectedSub, setSelectedSub] = useState(null);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div>
          <h2>Coding Submissions</h2>
          <p>View, evaluate, and manage candidate AI code submission records.</p>
        </div>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search by candidate, question, language, status…"
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            {table.rows.length} record{table.rows.length !== 1 ? "s" : ""}
          </span>
        </div>
        <AdminTable
          columns={COLUMNS}
          rows={table.rows}
          onEdit={(r) => setSelectedSub(r)}
          onDelete={table.handleDeleteClick}
          loading={table.loading}
          error={table.error}
          emptyMsg="No coding submissions found."
        />
      </div>

      {/* DETAIL VIEW MODAL */}
      {selectedSub && (
        <div className="admin-modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="admin-modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Submission Detail #{selectedSub.id}</h3>
              <button className="admin-modal__close" onClick={() => setSelectedSub(null)}>✕</button>
            </div>
            <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <strong>Candidate:</strong> {selectedSub.candidate_name} ({selectedSub.candidate_email})
              </div>
              <div>
                <strong>Question / Title:</strong> {selectedSub.question_title_display}
              </div>
              <div>
                <strong>Language:</strong> {selectedSub.language} | <strong>Status:</strong> {selectedSub.status} | <strong>Score:</strong> {selectedSub.score}%
              </div>
              <div>
                <label style={{ fontWeight: "bold", fontSize: "13px" }}>Submitted Code:</label>
                <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "12px", borderRadius: "8px", overflowX: "auto", fontSize: "13px" }}>
                  {selectedSub.code || "(No Code)"}
                </pre>
              </div>
              {selectedSub.output && (
                <div>
                  <label style={{ fontWeight: "bold", fontSize: "13px" }}>Program Output (stdout):</label>
                  <pre style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px", fontSize: "13px" }}>
                    {selectedSub.output}
                  </pre>
                </div>
              )}
              {selectedSub.error && (
                <div>
                  <label style={{ fontWeight: "bold", fontSize: "13px", color: "#dc2626" }}>Program Error (stderr):</label>
                  <pre style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px", borderRadius: "6px", fontSize: "13px" }}>
                    {selectedSub.error}
                  </pre>
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-primary" onClick={() => setSelectedSub(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        target={table.deleteTarget}
        label="Coding Submission"
        onConfirm={table.handleDeleteConfirm}
        onCancel={() => table.setDeleteTarget(null)}
        deleting={table.deleting}
      />
    </>
  );
}
