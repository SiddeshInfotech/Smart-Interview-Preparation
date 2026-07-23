import React, { useState } from "react";
import { getAvailabilities, createAvailability, updateAvailability, deleteAvailability } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const COLUMNS = [
  { key: "availability_id",  label: "ID" },
  { key: "interviewer_name", label: "Interviewer", render: (v, r) => v || `Interviewer #${r.interviewer}` },
  { key: "day_of_week",      label: "Day",         render: (v) => DAYS[v] ?? v },
  { key: "start_time",       label: "Start Time" },
  { key: "end_time",         label: "End Time" },
  { key: "status",           label: "Status",       render: (v) => <span className={`admin-badge ${v === "available" ? "admin-badge--success" : v === "booked" ? "admin-badge--warning" : "admin-badge--error"}`}>{v}</span> },
  { key: "created_at",       label: "Created",      render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { interviewer: "", day_of_week: 0, start_time: "09:00", end_time: "17:00", status: "available" };

export default function AdminAvailability() {
  const table = useAdminTable({ fetchFn: getAvailabilities, createFn: createAvailability, updateFn: updateAvailability, deleteFn: deleteAvailability, pkField: "availability_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Interviewer Availability</h2><p>Manage interviewer working hours and time slots.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-availability">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Time Slot
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search availability…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No availability records found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Time Slot" : "Add Time Slot"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Interviewer Profile ID *</label>
                  <input type="number" value={form.interviewer || ""} onChange={(e) => setForm({ ...form, interviewer: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Day of Week</label>
                  <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Start Time *</label>
                  <input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>End Time *</label>
                  <input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
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
      <ConfirmDeleteModal target={table.deleteTarget} label="Time Slot" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
