import React, { useState } from "react";
import { getSubmissions, createSubmission, updateSubmission, deleteSubmission } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "submission_id",      label: "ID"              },
  { key: "session_question_id",label: "Session Q ID"   },
  { key: "candidate_id",       label: "Candidate ID"   },
  { key: "language",           label: "Language",      render: (v) => <span className="admin-badge admin-badge--blue">{v}</span> },
  { key: "status",             label: "Status",        render: (v) => <span className={`admin-badge ${v === "accepted" ? "admin-badge--success" : v === "wrong_answer" ? "admin-badge--error" : "admin-badge--warning"}`}>{v}</span> },
  { key: "score",              label: "Score"          },
  { key: "runtime_ms",         label: "Runtime (ms)"  },
  { key: "submitted_at",       label: "Submitted",     render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { session_question_id: "", candidate_id: "", language: "python", source_code: "", status: "pending", execution_output: "", runtime_ms: "", score: "" };

export default function AdminSubmissions() {
  const table = useAdminTable({ fetchFn: getSubmissions, createFn: createSubmission, updateFn: updateSubmission, deleteFn: deleteSubmission, pkField: "submission_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Coding Submissions</h2><p>View all candidate code submissions.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-submission">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search submissions…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No submissions found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Submission" : "Add Submission"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Session Question ID *</label><input type="number" value={form.session_question_id || ""} onChange={(e) => setForm({ ...form, session_question_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Candidate ID *</label><input type="number" value={form.candidate_id || ""} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Language</label><select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="python">Python</option><option value="javascript">JavaScript</option><option value="java">Java</option><option value="cpp">C++</option><option value="c">C</option></select></div>
                <div className="admin-form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="wrong_answer">Wrong Answer</option><option value="runtime_error">Runtime Error</option></select></div>
                <div className="admin-form-group"><label>Score</label><input type="number" step="0.01" value={form.score || ""} onChange={(e) => setForm({ ...form, score: e.target.value })} /></div>
                <div className="admin-form-group"><label>Runtime (ms)</label><input type="number" value={form.runtime_ms || ""} onChange={(e) => setForm({ ...form, runtime_ms: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Source Code</label><textarea value={form.source_code || ""} onChange={(e) => setForm({ ...form, source_code: e.target.value })} style={{ fontFamily: "monospace", minHeight: "120px" }} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Execution Output</label><textarea value={form.execution_output || ""} onChange={(e) => setForm({ ...form, execution_output: e.target.value })} style={{ fontFamily: "monospace" }} /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Submission" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
