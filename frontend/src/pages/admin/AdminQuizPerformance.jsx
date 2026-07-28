import React, { useState } from "react";
import { getQuizPerformances, deleteQuizPerformance } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "id", label: "ID" },
  {
    key: "user_name",
    label: "Candidate",
    render: (v, r) => (
      <div>
        <strong>{v || "N/A"}</strong>
        <br />
        <small style={{ color: "#64748b" }}>{r.user_email || "N/A"}</small>
      </div>
    )
  },
  { key: "total_questions", label: "Questions" },
  { key: "correct_answers", label: "Correct", render: (v) => <span className="admin-badge admin-badge--success">{v}</span> },
  { key: "wrong_answers", label: "Wrong", render: (v) => <span className="admin-badge admin-badge--error">{v}</span> },
  { key: "skipped_answers", label: "Skipped", render: (v) => <span className="admin-badge admin-badge--neutral">{v}</span> },
  {
    key: "score",
    label: "Score (%)",
    render: (v) => (
      <span className={`admin-badge ${v >= 70 ? "admin-badge--success" : "admin-badge--warning"}`}>
        {v}%
      </span>
    )
  },
  { key: "created_at", label: "Date", render: (v) => (v ? new Date(v).toLocaleDateString() : "—") }
];

export default function AdminQuizPerformance() {
  const table = useAdminTable({
    fetchFn: getQuizPerformances,
    deleteFn: deleteQuizPerformance,
    pkField: "id"
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div>
          <h2>Quiz Performances</h2>
          <p>View and manage candidate practice quiz records, scores, and accuracy statistics.</p>
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
              placeholder="Search by candidate, score, accuracy…"
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
          onEdit={(r) => setSelectedRecord(r)}
          onDelete={table.handleDeleteClick}
          loading={table.loading}
          error={table.error}
          emptyMsg="No quiz performance records found."
        />
      </div>

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="admin-modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Quiz Performance Detail #{selectedRecord.id}</h3>
              <button className="admin-modal__close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <strong>Candidate:</strong> {selectedRecord.user_name} ({selectedRecord.user_email})
              </div>
              <div>
                <strong>Total Questions:</strong> {selectedRecord.total_questions} | <strong>Correct:</strong> {selectedRecord.correct_answers}
              </div>
              <div>
                <strong>Wrong Answers:</strong> {selectedRecord.wrong_answers} | <strong>Skipped:</strong> {selectedRecord.skipped_answers}
              </div>
              <div>
                <strong>Overall Score:</strong> <span className="admin-badge admin-badge--success">{selectedRecord.score}%</span>
              </div>
              <div>
                <strong>Submitted At:</strong> {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : "N/A"}
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-primary" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        target={table.deleteTarget}
        label="Quiz Performance Record"
        onConfirm={table.handleDeleteConfirm}
        onCancel={() => table.setDeleteTarget(null)}
        deleting={table.deleting}
      />
    </>
  );
}
