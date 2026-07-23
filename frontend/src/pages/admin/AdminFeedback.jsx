import React, { useState } from "react";
import { getFeedbacks, createFeedback, updateFeedback, deleteFeedback } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "feedback_id",     label: "ID"             },
  { key: "session_id",      label: "Session ID"     },
  { key: "interviewer_id",  label: "Interviewer ID" },
  { key: "overall_rating",  label: "Rating",        render: (v) => v ? `${v}/5` : "—" },
  { key: "recommendation",  label: "Recommendation",render: (v) => v ? <span className={`admin-badge ${v === "hire" ? "admin-badge--success" : v === "reject" ? "admin-badge--error" : "admin-badge--warning"}`}>{v}</span> : "—" },
  { key: "strengths",       label: "Strengths",     render: (v) => <span title={v}>{String(v || "").slice(0, 40)}{v?.length > 40 ? "…" : ""}</span> },
  { key: "created_at",      label: "Created",       render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { session_id: "", interviewer_id: "", overall_rating: "", strengths: "", weaknesses: "", comments: "", recommendation: "" };

export default function AdminFeedback() {
  const table = useAdminTable({ fetchFn: getFeedbacks, createFn: createFeedback, updateFn: updateFeedback, deleteFn: deleteFeedback, pkField: "feedback_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Interview Feedback</h2><p>View and manage post-interview feedback records.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-feedback">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Feedback
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search feedback…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No feedback records found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Feedback" : "Add Feedback"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Session ID *</label><input type="number" value={form.session_id || ""} onChange={(e) => setForm({ ...form, session_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Interviewer ID *</label><input type="number" value={form.interviewer_id || ""} onChange={(e) => setForm({ ...form, interviewer_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Overall Rating (0–5)</label><input type="number" step="0.1" min="0" max="5" value={form.overall_rating || ""} onChange={(e) => setForm({ ...form, overall_rating: e.target.value })} /></div>
                <div className="admin-form-group"><label>Recommendation</label><select value={form.recommendation || ""} onChange={(e) => setForm({ ...form, recommendation: e.target.value })}><option value="">—</option><option value="hire">Hire</option><option value="consider">Consider</option><option value="reject">Reject</option></select></div>
                <div className="admin-form-group admin-form-group--full"><label>Strengths</label><textarea value={form.strengths || ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Weaknesses</label><textarea value={form.weaknesses || ""} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Comments</label><textarea value={form.comments || ""} onChange={(e) => setForm({ ...form, comments: e.target.value })} /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Feedback" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
