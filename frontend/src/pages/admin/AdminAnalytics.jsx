import React, { useState } from "react";
import { getAnalytics, createAnalytic, updateAnalytic, deleteAnalytic } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "analytics_id",         label: "ID"           },
  { key: "candidate_id",         label: "Candidate ID" },
  { key: "session_id",           label: "Session ID"   },
  { key: "technical_score",      label: "Technical"    },
  { key: "communication_score",  label: "Communication"},
  { key: "problem_solving_score",label: "Problem Solving"},
  { key: "overall_score",        label: "Overall"      },
  { key: "percentile_rank",      label: "Percentile"   },
  { key: "generated_at",         label: "Generated",   render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { candidate_id: "", session_id: "", technical_score: "", communication_score: "", problem_solving_score: "", overall_score: "", percentile_rank: "" };

export default function AdminAnalytics() {
  const table = useAdminTable({ fetchFn: getAnalytics, createFn: createAnalytic, updateFn: updateAnalytic, deleteFn: deleteAnalytic, pkField: "analytics_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Performance Analytics</h2><p>Manage candidate performance analytics records.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-analytic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Record
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search analytics…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No analytics records found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Analytics" : "Add Analytics"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Candidate ID *</label><input type="number" value={form.candidate_id || ""} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Session ID *</label><input type="number" value={form.session_id || ""} onChange={(e) => setForm({ ...form, session_id: e.target.value })} /></div>
                {["technical_score","communication_score","problem_solving_score","overall_score","percentile_rank"].map((f) => (
                  <div key={f} className="admin-form-group">
                    <label>{f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</label>
                    <input type="number" step="0.01" value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Analytics Record" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
