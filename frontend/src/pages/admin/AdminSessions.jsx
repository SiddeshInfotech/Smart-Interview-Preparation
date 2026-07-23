import React, { useState } from "react";
import { getSessions, createSession, updateSession, deleteSession } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "session_id",    label: "ID"         },
  { key: "schedule_id",   label: "Schedule ID"},
  { key: "start_time",    label: "Start",     render: (v) => v ? new Date(v).toLocaleString() : "—" },
  { key: "end_time",      label: "End",       render: (v) => v ? new Date(v).toLocaleString() : "—" },
  { key: "status",        label: "Status",    render: (v) => <span className={`admin-badge ${v === "completed" ? "admin-badge--success" : v === "cancelled" ? "admin-badge--error" : "admin-badge--warning"}`}>{v}</span> },
  { key: "recording_url", label: "Recording", render: (v) => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Link</a> : "—" },
  { key: "created_at",    label: "Created",   render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { schedule_id: "", start_time: "", end_time: "", status: "in_progress", recording_url: "" };

export default function AdminSessions() {
  const table = useAdminTable({ fetchFn: getSessions, createFn: createSession, updateFn: updateSession, deleteFn: deleteSession, pkField: "session_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Interview Sessions</h2><p>View and manage all active and past interview sessions.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-session">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Session
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search sessions…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No sessions found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Session" : "Add Session"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Schedule ID *</label><input type="number" value={form.schedule_id || ""} onChange={(e) => setForm({ ...form, schedule_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div className="admin-form-group"><label>Start Time</label><input type="datetime-local" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div className="admin-form-group"><label>End Time</label><input type="datetime-local" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                <div className="admin-form-group admin-form-group--full"><label>Recording URL</label><input value={form.recording_url || ""} onChange={(e) => setForm({ ...form, recording_url: e.target.value })} /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Session" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
