import React, { useState } from "react";
import { getCodingQuestions, deleteCodingQuestion, createCodingQuestion, updateCodingQuestion } from "../../api/adminApi";
import { useAdminTable, AdminTable, ConfirmDeleteModal, AdminToast } from "./adminUtils";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title", render: (v, r) => <div><strong>{v}</strong><br/><small style={{ color: "#64748b" }}>{r.slug}</small></div> },
  {
    key: "difficulty",
    label: "Difficulty",
    render: (v) => {
      const cls = v === "Easy" ? "admin-badge--success" : v === "Medium" ? "admin-badge--warning" : "admin-badge--error";
      return <span className={`admin-badge ${cls}`}>{v}</span>;
    }
  },
  { key: "category", label: "Category", render: (v) => <span className="admin-badge admin-badge--purple">{v}</span> },
  { key: "created_at", label: "Created", render: (v) => (v ? new Date(v).toLocaleDateString() : "—") }
];

export default function AdminCodingQuestions() {
  const table = useAdminTable({
    fetchFn: getCodingQuestions,
    deleteFn: deleteCodingQuestion,
    pkField: "id"
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", slug: "", difficulty: "Easy", category: "Algorithms", description: "", input_format: "", output_format: "", sample_input: "", sample_output: "", constraints: "", starter_code: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", slug: "", difficulty: "Easy", category: "Algorithms", description: "", input_format: "", output_format: "", sample_input: "", sample_output: "", constraints: "", starter_code: "" });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      title: record.title || "",
      slug: record.slug || "",
      difficulty: record.difficulty || "Easy",
      category: record.category || "Algorithms",
      description: record.description || "",
      input_format: record.input_format || "",
      output_format: record.output_format || "",
      sample_input: record.sample_input || "",
      sample_output: record.sample_output || "",
      constraints: record.constraints || "",
      starter_code: record.starter_code || ""
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCodingQuestion(editingId, formData);
        table.toast("Coding question updated successfully!");
      } else {
        await createCodingQuestion(formData);
        table.toast("Coding question created successfully!");
      }
      setEditModalOpen(false);
      table.reload();
    } catch (err) {
      table.toast(err.response?.data?.detail || "Failed to save coding question", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminToast toast={table.toast} />
      <div className="admin-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Coding Questions</h2>
          <p>Create, edit, and manage algorithm coding challenges & test cases.</p>
        </div>
        <button className="admin-btn-primary" onClick={handleOpenCreate}>
          + Add Question
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
              placeholder="Search by title, category, difficulty…"
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
          onEdit={handleOpenEdit}
          onDelete={table.handleDeleteClick}
          loading={table.loading}
          error={table.error}
          emptyMsg="No coding questions found."
        />
      </div>

      {/* CREATE / EDIT MODAL */}
      {editModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: "720px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editingId ? `Edit Question #${editingId}` : "Create New Coding Question"}</h3>
              <button className="admin-modal__close" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "65vh", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Question Title *</label>
                    <input
                      className="admin-input"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Slug (URL identifier)</label>
                    <input
                      className="admin-input"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Difficulty *</label>
                    <select
                      className="admin-select"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Category *</label>
                    <input
                      className="admin-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "bold" }}>Problem Description *</label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Sample Input</label>
                    <textarea
                      className="admin-textarea"
                      rows={2}
                      value={formData.sample_input}
                      onChange={(e) => setFormData({ ...formData, sample_input: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Sample Output</label>
                    <textarea
                      className="admin-textarea"
                      rows={2}
                      value={formData.sample_output}
                      onChange={(e) => setFormData({ ...formData, sample_output: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "bold" }}>Starter Code Template</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={formData.starter_code}
                    onChange={(e) => setFormData({ ...formData, starter_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Question"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        target={table.deleteTarget}
        label="Coding Question"
        onConfirm={table.handleDeleteConfirm}
        onCancel={() => table.setDeleteTarget(null)}
        deleting={table.deleting}
      />
    </>
  );
}
