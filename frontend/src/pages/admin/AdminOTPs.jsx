import React, { useState } from "react";
import { getOtps, createOtp, updateOtp, deleteOtp } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "otp_id",      label: "ID"         },
  { key: "user_id",     label: "User ID"    },
  { key: "otp_code",    label: "OTP Code"   },
  { key: "purpose",     label: "Purpose",   render: (v) => <span className="admin-badge admin-badge--blue">{v}</span> },
  { key: "is_verified", label: "Verified",  render: (v) => <span className={`admin-badge ${v ? "admin-badge--success" : "admin-badge--warning"}`}>{v ? "Yes" : "No"}</span> },
  { key: "attempts",    label: "Attempts"   },
  { key: "expires_at",  label: "Expires",   render: (v) => v ? new Date(v).toLocaleString() : "—" },
  { key: "created_at",  label: "Created",   render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { user_id: "", otp_code: "", purpose: "registration", is_verified: false, attempts: 0, expires_at: "" };

export default function AdminOTPs() {
  const table = useAdminTable({ fetchFn: getOtps, createFn: createOtp, updateFn: updateOtp, deleteFn: deleteOtp, pkField: "otp_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>OTP Verification</h2><p>View and manage all OTP verification records.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-otp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add OTP
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search OTPs…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No OTP records found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit OTP" : "Add OTP"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>User ID *</label><input type="number" value={form.user_id || ""} onChange={(e) => setForm({ ...form, user_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>OTP Code *</label><input value={form.otp_code || ""} onChange={(e) => setForm({ ...form, otp_code: e.target.value })} placeholder="123456" /></div>
                <div className="admin-form-group"><label>Purpose</label><select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}><option value="registration">Registration</option><option value="login">Login</option><option value="password_reset">Password Reset</option><option value="email_verification">Email Verification</option></select></div>
                <div className="admin-form-group"><label>Attempts</label><input type="number" value={form.attempts || 0} onChange={(e) => setForm({ ...form, attempts: parseInt(e.target.value) })} /></div>
                <div className="admin-form-group"><label>Is Verified</label><select value={form.is_verified ? "true" : "false"} onChange={(e) => setForm({ ...form, is_verified: e.target.value === "true" })}><option value="false">No</option><option value="true">Yes</option></select></div>
                <div className="admin-form-group"><label>Expires At *</label><input type="datetime-local" value={form.expires_at || ""} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="OTP Record" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
