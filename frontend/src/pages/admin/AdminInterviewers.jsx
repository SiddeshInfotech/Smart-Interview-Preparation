import React, { useState } from "react";
import { getInterviewers, createInterviewer, updateInterviewer, deleteInterviewer } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "interviewer_id",     label: "ID"          },
  { key: "user_id",            label: "User ID"     },
  { key: "user_name",          label: "Name"        },
  { key: "user_email",         label: "Email"       },
  { key: "designation",        label: "Designation" },
  { key: "company",            label: "Company"     },
  { key: "department",         label: "Department"  },
  { key: "years_of_experience",label: "Exp (yrs)"  },
  { key: "is_available",       label: "Available",  render: (v) => <span className={`admin-badge ${v ? "admin-badge--success" : "admin-badge--error"}`}>{v ? "Yes" : "No"}</span> },
  { key: "created_at",         label: "Created",    render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { user_id: "", department: "", designation: "", company: "", expertise_area: "", years_of_experience: "", linkedin_url: "", github_url: "", website_url: "", is_available: true };

export default function AdminInterviewers() {
  const table = useAdminTable({ fetchFn: getInterviewers, createFn: createInterviewer, updateFn: updateInterviewer, deleteFn: deleteInterviewer, pkField: "interviewer_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Interviewer Profiles</h2><p>Manage all interviewer accounts and their details.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-interviewer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Interviewer
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search interviewers…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No interviewer profiles found." />
      </div>

      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Interviewer" : "Add Interviewer"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>User ID *</label>
                  <input type="number" value={form.user_id || ""} onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Company</label>
                  <input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Google / PrepMasterAI" />
                </div>
                <div className="admin-form-group">
                  <label>Designation</label>
                  <input value={form.designation || ""} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Senior Engineer" />
                </div>
                <div className="admin-form-group">
                  <label>Department</label>
                  <input value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
                </div>
                <div className="admin-form-group">
                  <label>Years of Experience</label>
                  <input type="number" step="0.5" value={form.years_of_experience || ""} onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Available</label>
                  <select value={form.is_available ? "true" : "false"} onChange={(e) => setForm({ ...form, is_available: e.target.value === "true" })}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Expertise Area</label>
                  <textarea value={form.expertise_area || ""} onChange={(e) => setForm({ ...form, expertise_area: e.target.value })} placeholder="React, Node.js, System Design…" />
                </div>
                <div className="admin-form-group">
                  <label>LinkedIn URL</label>
                  <input value={form.linkedin_url || ""} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="admin-form-group">
                  <label>GitHub URL</label>
                  <input value={form.github_url || ""} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." />
                </div>
                <div className="admin-form-group">
                  <label>Website URL</label>
                  <input value={form.website_url || ""} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://portfolio.dev" />
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
      <ConfirmDeleteModal target={table.deleteTarget} label="Interviewer Profile" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
