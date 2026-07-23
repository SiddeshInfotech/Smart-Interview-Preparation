import React, { useState } from "react";
import { getNotifications, createNotification, updateNotification, deleteNotification } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "notification_id", label: "ID"       },
  { key: "user_id",         label: "User ID"  },
  { key: "title",           label: "Title"    },
  { key: "message",         label: "Message", render: (v) => <span title={v}>{String(v || "").slice(0, 50)}{v?.length > 50 ? "…" : ""}</span> },
  { key: "type",            label: "Type",    render: (v) => <span className="admin-badge admin-badge--blue">{v}</span> },
  { key: "is_read",         label: "Read",    render: (v) => <span className={`admin-badge ${v ? "admin-badge--success" : "admin-badge--neutral"}`}>{v ? "Yes" : "No"}</span> },
  { key: "created_at",      label: "Created", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { user_id: "", title: "", message: "", type: "system", is_read: false };

export default function AdminNotifications() {
  const table = useAdminTable({ fetchFn: getNotifications, createFn: createNotification, updateFn: updateNotification, deleteFn: deleteNotification, pkField: "notification_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Notifications</h2><p>View and manage all system notifications.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-notification">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Notification
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search notifications…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No notifications found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Notification" : "Add Notification"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>User ID *</label><input type="number" value={form.user_id || ""} onChange={(e) => setForm({ ...form, user_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="system">System</option><option value="interview">Interview</option><option value="result">Result</option><option value="reminder">Reminder</option></select></div>
                <div className="admin-form-group admin-form-group--full"><label>Title *</label><input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" /></div>
                <div className="admin-form-group admin-form-group--full"><label>Message *</label><textarea value={form.message || ""} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                <div className="admin-form-group"><label>Is Read</label><select value={form.is_read ? "true" : "false"} onChange={(e) => setForm({ ...form, is_read: e.target.value === "true" })}><option value="false">No</option><option value="true">Yes</option></select></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Notification" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
