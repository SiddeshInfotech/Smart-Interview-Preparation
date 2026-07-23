import React, { useState } from "react";
import { getSessionQuestions, createSessionQuestion, updateSessionQuestion, deleteSessionQuestion } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "session_question_id",  label: "ID"           },
  { key: "session_id",           label: "Session ID"   },
  { key: "question_id",          label: "Question ID"  },
  { key: "sequence_number",      label: "Seq #"        },
  { key: "time_allotted_seconds",label: "Time (sec)"  },
  { key: "score_awarded",        label: "Score"        },
  { key: "candidate_answer",     label: "Answer",      render: (v) => <span title={v}>{String(v || "").slice(0, 40)}{v?.length > 40 ? "…" : ""}</span> },
];

const EMPTY = { session_id: "", question_id: "", sequence_number: 1, time_allotted_seconds: "", candidate_answer: "", score_awarded: "" };

export default function AdminSessionQuestions() {
  const table = useAdminTable({ fetchFn: getSessionQuestions, createFn: createSessionQuestion, updateFn: updateSessionQuestion, deleteFn: deleteSessionQuestion, pkField: "session_question_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Session Questions</h2><p>Manage questions assigned to interview sessions.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-session-question">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No session questions found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Session Question" : "Add Session Question"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Session ID *</label><input type="number" value={form.session_id || ""} onChange={(e) => setForm({ ...form, session_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Question ID *</label><input type="number" value={form.question_id || ""} onChange={(e) => setForm({ ...form, question_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Sequence #</label><input type="number" value={form.sequence_number || ""} onChange={(e) => setForm({ ...form, sequence_number: e.target.value })} /></div>
                <div className="admin-form-group"><label>Time Allotted (sec)</label><input type="number" value={form.time_allotted_seconds || ""} onChange={(e) => setForm({ ...form, time_allotted_seconds: e.target.value })} /></div>
                <div className="admin-form-group"><label>Score Awarded</label><input type="number" step="0.01" value={form.score_awarded || ""} onChange={(e) => setForm({ ...form, score_awarded: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Candidate Answer</label><textarea value={form.candidate_answer || ""} onChange={(e) => setForm({ ...form, candidate_answer: e.target.value })} /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Session Question" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
