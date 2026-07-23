import React, { useState } from "react";
import { getResumeAnalyses, createResumeAnalysis, updateResumeAnalysis, deleteResumeAnalysis } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "analysis_id",      label: "ID"         },
  { key: "resume_id",        label: "Resume ID"  },
  { key: "ats_score",        label: "ATS Score"  },
  { key: "extracted_skills", label: "Skills",    render: (v) => <span title={v}>{String(v || "").slice(0, 40)}{v?.length > 40 ? "…" : ""}</span> },
  { key: "strengths",        label: "Strengths", render: (v) => <span title={v}>{String(v || "").slice(0, 40)}{v?.length > 40 ? "…" : ""}</span> },
  { key: "analyzed_at",      label: "Analyzed",  render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { resume_id: "", ats_score: "", extracted_skills: "", strengths: "", weaknesses: "", suggestions: "" };

export default function AdminResumeAnalysis() {
  const table = useAdminTable({ fetchFn: getResumeAnalyses, createFn: createResumeAnalysis, updateFn: updateResumeAnalysis, deleteFn: deleteResumeAnalysis, pkField: "analysis_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Resume Analysis</h2><p>View and manage AI-generated resume analysis records.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-resume-analysis">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Analysis
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search analyses…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No analysis records found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Analysis" : "Add Analysis"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Resume ID *</label><input type="number" value={form.resume_id || ""} onChange={(e) => setForm({ ...form, resume_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>ATS Score</label><input type="number" step="0.01" value={form.ats_score || ""} onChange={(e) => setForm({ ...form, ats_score: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Extracted Skills</label><textarea value={form.extracted_skills || ""} onChange={(e) => setForm({ ...form, extracted_skills: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Strengths</label><textarea value={form.strengths || ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Weaknesses</label><textarea value={form.weaknesses || ""} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Suggestions</label><textarea value={form.suggestions || ""} onChange={(e) => setForm({ ...form, suggestions: e.target.value })} /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Analysis" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
