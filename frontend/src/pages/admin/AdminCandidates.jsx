import React, { useState } from "react";
import { getCandidates, createCandidate, updateCandidate, deleteCandidate } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "candidate_id",      label: "ID"          },
  { key: "user_id",           label: "User ID"     },
  { key: "gender",            label: "Gender"      },
  { key: "location",          label: "Location"    },
  { key: "education",         label: "Education"   },
  { key: "experience_years",  label: "Exp (yrs)"  },
  { key: "skills",            label: "Skills",     render: (v) => <span title={v}>{String(v || "").slice(0, 40)}{v?.length > 40 ? "…" : ""}</span> },
  { key: "created_at",        label: "Created",    render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { user_id: "", date_of_birth: "", gender: "", location: "", education: "", experience_years: "", skills: "", linkedin_url: "", github_url: "", portfolio_url: "" };

export default function AdminCandidates() {
  const table = useAdminTable({ fetchFn: getCandidates, createFn: createCandidate, updateFn: updateCandidate, deleteFn: deleteCandidate, pkField: "candidate_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Candidate Profiles</h2><p>View and manage all candidate profiles.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-candidate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Candidate
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search candidates…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No candidate profiles found." />
      </div>

      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Candidate" : "Add Candidate"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>User ID *</label>
                  <input type="number" value={form.user_id || ""} onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Gender</label>
                  <select value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">—</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Location</label>
                  <input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" />
                </div>
                <div className="admin-form-group">
                  <label>Education</label>
                  <input value={form.education || ""} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="B.Tech CS" />
                </div>
                <div className="admin-form-group">
                  <label>Experience (years)</label>
                  <input type="number" step="0.5" value={form.experience_years || ""} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
                </div>
                <div className="admin-form-group admin-form-group--full">
                  <label>Skills</label>
                  <textarea value={form.skills || ""} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, SQL…" />
                </div>
                <div className="admin-form-group">
                  <label>LinkedIn URL</label>
                  <input value={form.linkedin_url || ""} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>GitHub URL</label>
                  <input value={form.github_url || ""} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Portfolio URL</label>
                  <input value={form.portfolio_url || ""} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
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
      <ConfirmDeleteModal target={table.deleteTarget} label="Candidate Profile" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
