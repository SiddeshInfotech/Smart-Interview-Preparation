import React, { useState } from "react";
import {
  getInterviewFeedbackReviews,
  createInterviewFeedbackReview,
  updateInterviewFeedbackReview,
  deleteInterviewFeedbackReview,
} from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "review_id",            label: "ID" },
  { key: "candidate_name",       label: "Candidate", render: (v, r) => v || `ID: ${r.candidate}` },
  { key: "interviewer_name",     label: "Interviewer", render: (v, r) => v || `ID: ${r.interviewer}` },
  { key: "overall_rating",       label: "Score", render: (v) => <strong style={{ color: "#2563eb" }}>⭐ {v} / 5.0</strong> },
  { key: "recommendation",       label: "Recommendation", render: (v) => <span className={`admin-badge ${v === "Strongly Recommend" || v === "Recommend" ? "admin-badge--success" : v === "Neutral" ? "admin-badge--warning" : "admin-badge--error"}`}>{v}</span> },
  { key: "technical_skills",     label: "Technical", render: (v) => `${v} ★` },
  { key: "communication_skills", label: "Communication", render: (v) => `${v} ★` },
  { key: "submitted_at",         label: "Submitted", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = {
  candidate: "",
  interviewer: "",
  schedule: "",
  technical_skills: 4,
  communication_skills: 4,
  problem_solving: 4,
  soft_skills: 4,
  code_quality: 4,
  overall_rating: "4.0",
  strengths: "",
  weaknesses: "",
  comments: "",
  recommendation: "Recommend",
};

export default function AdminInterviewFeedbackReviews() {
  const table = useAdminTable({
    fetchFn: getInterviewFeedbackReviews,
    createFn: createInterviewFeedbackReview,
    updateFn: updateInterviewFeedbackReview,
    deleteFn: deleteInterviewFeedbackReview,
    pkField: "review_id",
  });

  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div>
          <h2>Interview Assessment Feedback Reviews</h2>
          <p>View and manage candidate interview evaluation feedback submitted by interviewers.</p>
        </div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Feedback Review
        </button>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search assessment reviews…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable
          columns={COLUMNS}
          rows={table.rows}
          onEdit={(r) => { setForm(r); table.handleEdit(r); }}
          onDelete={table.handleDeleteClick}
          loading={table.loading}
          error={table.error}
          emptyMsg="No interview feedback reviews found."
        />
      </div>

      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Assessment Review" : "Add Assessment Review"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Candidate Profile ID *</label>
                  <input
                    type="number"
                    value={form.candidate || ""}
                    onChange={(e) => setForm({ ...form, candidate: e.target.value })}
                    placeholder="Candidate Profile ID"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Interviewer Profile ID *</label>
                  <input
                    type="number"
                    value={form.interviewer || ""}
                    onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
                    placeholder="Interviewer Profile ID"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Schedule ID</label>
                  <input
                    type="number"
                    value={form.schedule || ""}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    placeholder="Interview Schedule ID"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Overall Score Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={form.overall_rating || "4.0"}
                    onChange={(e) => setForm({ ...form, overall_rating: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Technical Skills (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.technical_skills || 4}
                    onChange={(e) => setForm({ ...form, technical_skills: parseInt(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Communication Skills (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.communication_skills || 4}
                    onChange={(e) => setForm({ ...form, communication_skills: parseInt(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Problem Solving (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.problem_solving || 4}
                    onChange={(e) => setForm({ ...form, problem_solving: parseInt(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Soft Skills (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.soft_skills || 4}
                    onChange={(e) => setForm({ ...form, soft_skills: parseInt(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Code Quality (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.code_quality || 4}
                    onChange={(e) => setForm({ ...form, code_quality: parseInt(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Recommendation</label>
                  <select
                    value={form.recommendation || "Recommend"}
                    onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
                  >
                    <option value="Strongly Recommend">Strongly Recommend</option>
                    <option value="Recommend">Recommend</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Do Not Recommend">Do Not Recommend</option>
                  </select>
                </div>

                <div className="admin-form-group admin-form-group--full">
                  <label>Strengths</label>
                  <textarea
                    value={form.strengths || ""}
                    onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Areas for Improvement / Weaknesses</label>
                  <textarea
                    value={form.weaknesses || ""}
                    onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                  />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Comments & Remarks</label>
                  <textarea
                    value={form.comments || ""}
                    onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>
                {table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal
        target={table.deleteTarget}
        label="Feedback Review"
        onConfirm={table.handleDeleteConfirm}
        onCancel={() => table.setDeleteTarget(null)}
        deleting={table.deleting}
      />
    </>
  );
}
