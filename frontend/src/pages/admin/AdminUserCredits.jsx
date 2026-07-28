import React, { useState } from "react";
import { getUserCredits, createUserCredit, updateUserCredit, deleteUserCredit } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "credit_id", label: "ID" },
  {
    key: "user_name",
    label: "User",
    render: (v, r) => (
      <div>
        <strong>{v || "N/A"}</strong>
        <br />
        <small style={{ color: "#64748b" }}>{r.user_email || "N/A"}</small>
      </div>
    )
  },
  {
    key: "quiz_used",
    label: "Quiz Credits",
    render: (v, r) => (
      <span>
        <strong>{v}</strong> / {r.quiz_limit} (Daily)
      </span>
    )
  },
  {
    key: "coding_used",
    label: "Coding Credits",
    render: (v, r) => (
      <span>
        <strong>{v}</strong> / {r.coding_limit} (Daily)
      </span>
    )
  },
  {
    key: "resume_used",
    label: "Resume Credits",
    render: (v, r) => (
      <span>
        <strong>{v}</strong> / {r.resume_limit} (Monthly)
      </span>
    )
  },
  { key: "updated_at", label: "Last Updated", render: (v) => (v ? new Date(v).toLocaleString() : "—") }
];

const EMPTY = {
  user_id: "",
  quiz_used: 0,
  quiz_limit: 20,
  coding_used: 0,
  coding_limit: 20,
  resume_used: 0,
  resume_limit: 5,
};

export default function AdminUserCredits() {
  const table = useAdminTable({
    fetchFn: getUserCredits,
    createFn: createUserCredit,
    updateFn: updateUserCredit,
    deleteFn: deleteUserCredit,
    pkField: "credit_id"
  });

  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div>
          <h2>User Credits & Limits</h2>
          <p>Track and manage user daily quiz, coding, and monthly resume analysis credit usage and limits.</p>
        </div>
        <button
          className="admin-btn-primary"
          onClick={() => {
            setForm(EMPTY);
            table.handleAdd();
          }}
          id="admin-add-user-credit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add User Credit
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search by user name, email, credits…"
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            {table.rows.length} record{table.rows.length !== 1 ? "s" : ""}
          </span>
        </div>
        <AdminTable
          columns={COLUMNS}
          rows={table.rows}
          onEdit={(r) => {
            setForm(r);
            table.handleEdit(r);
          }}
          onDelete={table.handleDeleteClick}
          loading={table.loading}
          error={table.error}
          emptyMsg="No user credit records found."
        />
      </div>

      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit User Credits" : "Add User Credit"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                {!table.editRow && (
                  <div className="admin-form-group admin-form-group--full">
                    <label>User ID *</label>
                    <input
                      type="number"
                      value={form.user || form.user_id || ""}
                      onChange={(e) => setForm({ ...form, user: e.target.value })}
                      placeholder="e.g. 1"
                    />
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Quiz Used Today</label>
                  <input
                    type="number"
                    value={form.quiz_used ?? 0}
                    onChange={(e) => setForm({ ...form, quiz_used: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Quiz Daily Limit</label>
                  <input
                    type="number"
                    value={form.quiz_limit ?? 20}
                    onChange={(e) => setForm({ ...form, quiz_limit: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Coding Used Today</label>
                  <input
                    type="number"
                    value={form.coding_used ?? 0}
                    onChange={(e) => setForm({ ...form, coding_used: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Coding Daily Limit</label>
                  <input
                    type="number"
                    value={form.coding_limit ?? 20}
                    onChange={(e) => setForm({ ...form, coding_limit: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Resume Used This Month</label>
                  <input
                    type="number"
                    value={form.resume_used ?? 0}
                    onChange={(e) => setForm({ ...form, resume_used: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Resume Monthly Limit</label>
                  <input
                    type="number"
                    value={form.resume_limit ?? 5}
                    onChange={(e) => setForm({ ...form, resume_limit: parseInt(e.target.value, 10) || 0 })}
                  />
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

      <ConfirmDeleteModal
        target={table.deleteTarget}
        label="User Credit Record"
        onConfirm={table.handleDeleteConfirm}
        onCancel={() => table.setDeleteTarget(null)}
        deleting={table.deleting}
      />
    </>
  );
}
