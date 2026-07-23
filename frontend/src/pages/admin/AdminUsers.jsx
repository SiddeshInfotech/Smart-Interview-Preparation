import React, { useState } from "react";
import {
  getUsers, createUser, updateUser, deleteUser,
} from "../../api/adminApi";
import {
  useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast,
} from "./adminUtils";

const COLUMNS = [
  { key: "user_id",          label: "ID"       },
  { key: "full_name",        label: "Name"     },
  { key: "email",            label: "Email"    },
  { key: "role",             label: "Role",    render: (v) => <span className={`admin-badge admin-badge--${v === "superuser" ? "error" : v === "interviewer" ? "blue" : "neutral"}`}>{v}</span> },
  { key: "is_active",        label: "Active",  render: (v) => <span className={`admin-badge ${v ? "admin-badge--success" : "admin-badge--error"}`}>{v ? "Yes" : "No"}</span> },
  { key: "is_email_verified",label: "Verified",render: (v) => <span className={`admin-badge ${v ? "admin-badge--success" : "admin-badge--warning"}`}>{v ? "Yes" : "No"}</span> },
  { key: "created_at",       label: "Created", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY_FORM = {
  full_name: "", email: "", password: "", role: "candidate",
  phone_number: "", is_active: true, is_email_verified: false,
};

export default function AdminUsers() {
  const table = useAdminTable({
    fetchFn: getUsers, createFn: createUser, updateFn: updateUser, deleteFn: deleteUser,
    pkField: "user_id",
  });

  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    table.handleAdd();
  };

  const openEdit = (row) => {
    setForm({ ...row, password: "" });
    table.handleEdit(row);
  };

  const handleSave = () => table.handleFormSubmit(form);

  return (
    <>
      <AdminToast toast={table.toast} />

      <div className="admin-section-header">
        <div>
          <h2>Users</h2>
          <p>Manage all registered user accounts on the platform.</p>
        </div>
        <button className="admin-btn-primary" onClick={openAdd} id="admin-add-user">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add User
        </button>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search users…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable
          columns={COLUMNS}
          rows={table.rows}
          onEdit={openEdit}
          onDelete={table.handleDeleteClick}
          loading={table.loading}
          error={table.error}
          emptyMsg="No users found."
        />
      </div>

      {/* Add/Edit Modal */}
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit User" : "Add User"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Full Name *</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="admin-form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                </div>
                <div className="admin-form-group">
                  <label>{table.editRow ? "New Password (leave blank to keep)" : "Password *"}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="admin-form-group">
                  <label>Phone Number</label>
                  <input value={form.phone_number || ""} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+91 9876543210" />
                </div>
                <div className="admin-form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="candidate">Candidate</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Active</label>
                  <select value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Email Verified</label>
                  <select value={form.is_email_verified ? "true" : "false"} onChange={(e) => setForm({ ...form, is_email_verified: e.target.value === "true" })}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={table.saving}>
                {table.saving ? "Saving…" : table.editRow ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDeleteModal
        target={table.deleteTarget}
        label="User"
        onConfirm={table.handleDeleteConfirm}
        onCancel={() => table.setDeleteTarget(null)}
        deleting={table.deleting}
      />
    </>
  );
}
