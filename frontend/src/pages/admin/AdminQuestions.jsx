import React, { useState } from "react";
import {
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
} from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "question_id",   label: "ID"         },
  { key: "question_text", label: "Question",  render: (v) => <span title={v}>{String(v || "").slice(0, 60)}{v?.length > 60 ? "…" : ""}</span> },
  { key: "category",      label: "Category"  },
  { key: "question_type", label: "Type",     render: (v) => <span className="admin-badge admin-badge--blue">{v}</span> },
  { key: "difficulty",    label: "Difficulty",render: (v) => <span className={`admin-badge ${v === "easy" ? "admin-badge--success" : v === "medium" ? "admin-badge--warning" : "admin-badge--error"}`}>{v}</span> },
  { key: "max_score",     label: "Max Score" },
  { key: "is_active",     label: "Active",   render: (v) => <span className={`admin-badge ${v ? "admin-badge--success" : "admin-badge--error"}`}>{v ? "Yes" : "No"}</span> },
  { key: "created_at",    label: "Created",  render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { question_text: "", category: "", question_type: "aptitude", difficulty: "easy", correct_answer: "", max_score: 10, is_active: true };

export default function AdminQuestions() {
  const table = useAdminTable({ fetchFn: getQuestions, createFn: createQuestion, updateFn: updateQuestion, deleteFn: deleteQuestion, pkField: "question_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Question Bank</h2><p>Manage all interview and aptitude questions.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-question">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Question
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search questions…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No questions found." />
      </div>

      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Question" : "Add Question"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group admin-form-group--full">
                  <label>Question Text *</label>
                  <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} placeholder="Enter question…" style={{ minHeight: "90px" }} />
                </div>
                <div className="admin-form-group">
                  <label>Category</label>
                  <input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Data Structures" />
                </div>
                <div className="admin-form-group">
                  <label>Type</label>
                  <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}>
                    <option value="aptitude">Aptitude</option>
                    <option value="coding">Coding</option>
                    <option value="verbal">Verbal</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Max Score</label>
                  <input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Correct Answer</label>
                  <textarea value={form.correct_answer || ""} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} placeholder="Optional correct answer…" />
                </div>
                <div className="admin-form-group">
                  <label>Active</label>
                  <select value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
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
      <ConfirmDeleteModal target={table.deleteTarget} label="Question" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
