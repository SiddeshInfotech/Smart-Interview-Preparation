import React, { useState } from "react";
import { getFeedbacks, createFeedback, updateFeedback, deleteFeedback } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "feedback_id",        label: "ID" },
  { key: "name",               label: "Name" },
  { key: "email",              label: "Email" },
  { key: "overall_experience", label: "Experience", render: (v) => <span className={`admin-badge ${v === "Excellent" || v === "Good" ? "admin-badge--success" : v === "Average" ? "admin-badge--warning" : "admin-badge--error"}`}>{v}</span> },
  { key: "recommend",          label: "Recommend",  render: (v) => <span className={`admin-badge ${v === "Yes" ? "admin-badge--success" : "admin-badge--error"}`}>{v}</span> },
  { key: "mock_interview",     label: "Mock Interview", render: (v) => <span title={v}>{String(v || "").slice(0, 40)}{v?.length > 40 ? "…" : ""}</span> },
  { key: "submitted_at",       label: "Submitted", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = {
  name: "",
  email: "",
  overall_experience: "Excellent",
  mock_interview: "",
  suggestions: "",
  comments: "",
  recommend: "Yes",
  recommendation_reason: "",
};

export default function AdminFeedback() {
  const table = useAdminTable({ fetchFn: getFeedbacks, createFn: createFeedback, updateFn: updateFeedback, deleteFn: deleteFeedback, pkField: "feedback_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>User Feedback</h2><p>View and manage platform user feedback entries.</p></div>
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
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No feedback entries found." />
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
                <div className="admin-form-group">
                  <label>Name *</label>
                  <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="admin-form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                </div>
                <div className="admin-form-group">
                  <label>Overall Experience</label>
                  <select value={form.overall_experience} onChange={(e) => setForm({ ...form, overall_experience: e.target.value })}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Recommend Platform</label>
                  <select value={form.recommend} onChange={(e) => setForm({ ...form, recommend: e.target.value })}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Mock Interview Experience</label>
                  <textarea value={form.mock_interview || ""} onChange={(e) => setForm({ ...form, mock_interview: e.target.value })} />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Suggestions</label>
                  <textarea value={form.suggestions || ""} onChange={(e) => setForm({ ...form, suggestions: e.target.value })} />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Comments</label>
                  <textarea value={form.comments || ""} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Recommendation Reason</label>
                  <textarea value={form.recommendation_reason || ""} onChange={(e) => setForm({ ...form, recommendation_reason: e.target.value })} />
                </div>
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
