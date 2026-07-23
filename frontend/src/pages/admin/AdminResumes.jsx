import React, { useState } from "react";
import { getResumes, createResume, updateResume, deleteResume } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "resume_id",    label: "ID"           },
  { key: "candidate_id", label: "Candidate ID" },
  { key: "file_name",    label: "File Name"    },
  { key: "file_size_kb", label: "Size (KB)"    },
  { key: "status",       label: "Status",      render: (v) => <span className={`admin-badge ${v === "active" ? "admin-badge--success" : v === "archived" ? "admin-badge--neutral" : "admin-badge--warning"}`}>{v}</span> },
  { key: "uploaded_at",  label: "Uploaded",    render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const EMPTY = { candidate_id: "", file_name: "", file_path: "", file_size_kb: "", status: "active" };

export default function AdminResumes() {
  const table = useAdminTable({ fetchFn: getResumes, createFn: createResume, updateFn: updateResume, deleteFn: deleteResume, pkField: "resume_id" });
  const [form, setForm] = useState(EMPTY);

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header">
        <div><h2>Resumes</h2><p>Manage all uploaded candidate resumes.</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(EMPTY); table.handleAdd(); }} id="admin-add-resume">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Resume
        </button>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <input placeholder="Search resumes…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{table.rows.length} record{table.rows.length !== 1 ? "s" : ""}</span>
        </div>
        <AdminTable columns={COLUMNS} rows={table.rows} onEdit={(r) => { setForm(r); table.handleEdit(r); }} onDelete={table.handleDeleteClick} loading={table.loading} error={table.error} emptyMsg="No resumes found." />
      </div>
      {table.showForm && (
        <div className="admin-modal-overlay" onClick={() => table.setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{table.editRow ? "Edit Resume" : "Add Resume"}</h3>
              <button className="admin-modal__close" onClick={() => table.setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group"><label>Candidate ID *</label><input type="number" value={form.candidate_id || ""} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} /></div>
                <div className="admin-form-group"><label>File Name *</label><input value={form.file_name || ""} onChange={(e) => setForm({ ...form, file_name: e.target.value })} placeholder="resume.pdf" /></div>
                <div className="admin-form-group"><label>File Size (KB)</label><input type="number" value={form.file_size_kb || ""} onChange={(e) => setForm({ ...form, file_size_kb: e.target.value })} /></div>
                <div className="admin-form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="archived">Archived</option><option value="pending">Pending</option></select></div>
                <div className="admin-form-group admin-form-group--full"><label>File Path</label><input value={form.file_path || ""} onChange={(e) => setForm({ ...form, file_path: e.target.value })} placeholder="/media/resumes/…" /></div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => table.setShowForm(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => table.handleFormSubmit(form)} disabled={table.saving}>{table.saving ? "Saving…" : table.editRow ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal target={table.deleteTarget} label="Resume" onConfirm={table.handleDeleteConfirm} onCancel={() => table.setDeleteTarget(null)} deleting={table.deleting} />
    </>
  );
}
