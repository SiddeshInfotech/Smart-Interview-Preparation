import React, { useState } from "react";
import { getInterviews, createInterview, updateInterview, deleteInterview } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "schedule_id",      label: "ID"           },
  { key: "candidate_id",     label: "Candidate ID" },
  { key: "interviewer_id",   label: "Interviewer ID"},
  { key: "scheduled_date",   label: "Date"         },
  { key: "scheduled_time",   label: "Time"         },
  { key: "duration_minutes", label: "Duration (min)"},
  { key: "status",           label: "Status",      render: (v) => <span className={`admin-badge ${v === "completed" ? "admin-badge--success" : v === "cancelled" ? "admin-badge--error" : "admin-badge--warning"}`}>{v}</span> },
  { key: "created_at",       label: "Created",     render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { candidate_id: "", interviewer_id: "", scheduled_date: "", scheduled_time: "", duration_minutes: 60, status: "scheduled", meeting_link: "" };

export default function AdminInterviews() {
  const table = useAdminTable({ fetchFn: getInterviews, createFn: createInterview, updateFn: updateInterview, deleteFn: deleteInterview, pkField: "schedule_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Interview Schedules</h2><p>Manage all scheduled interviews.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-interview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Schedule
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search schedules…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No schedules found." />
      </div>

      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Schedule" : "Add Schedule"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Candidate ID *</label><input type="number" value={form.candidate_id || ""} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Interviewer ID *</label><input type="number" value={form.interviewer_id || ""} onChange={(e) => setForm({ ...form, interviewer_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Date *</label><input type="date" value={form.scheduled_date || ""} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
                <div className="admin-form-group"><label>Time *</label><input type="time" value={form.scheduled_time || ""} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} /></div>
                <div className="admin-form-group"><label>Duration (minutes)</label><input type="number" value={form.duration_minutes || 60} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} /></div>
                <div className="admin-form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div className="admin-form-group admin-form-group--full"><label>Meeting Link</label><input value={form.meeting_link || ""} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} placeholder="https://meet.google.com/…" /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Interview Schedule" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
