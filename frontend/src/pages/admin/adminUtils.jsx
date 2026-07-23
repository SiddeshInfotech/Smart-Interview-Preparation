import React, { useState, useEffect, useCallback } from "react";

/**
 * useAdminTable — generic data-fetching + CRUD state hook.
 *
 * @param {Function} fetchFn   — async fn that returns { data: { data: [] } }
 * @param {Function} createFn  — async fn(data)
 * @param {Function} updateFn  — async fn(id, data)
 * @param {Function} deleteFn  — async fn(id)
 * @param {String}   pkField   — primary key field name in each record
 */
export function useAdminTable({ fetchFn, createFn, updateFn, deleteFn, pkField = "id" }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [toast, setToast]         = useState(null);

  // Modal states
  const [showForm, setShowForm]   = useState(false);
  const [editRow, setEditRow]     = useState(null);      // null = add, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  // Search
  const [search, setSearch]       = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchFn();
      setRows(res.data?.data || []);
    } catch {
      setError("Failed to load data. Check your connection or try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = () => {
    setEditRow(null);
    setShowForm(true);
  };

  const handleEdit = (row) => {
    setEditRow(row);
    setShowForm(true);
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
  };

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editRow) {
        await updateFn(editRow[pkField], formData);
        showToast("Record updated successfully.");
      } else {
        await createFn(formData);
        showToast("Record created successfully.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFn(deleteTarget[pkField]);
      showToast("Record deleted.");
      setDeleteTarget(null);
      load();
    } catch {
      showToast("Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = search
    ? rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows;

  return {
    rows: filteredRows,
    allRows: rows,
    loading,
    error,
    toast,
    search,
    setSearch,
    showForm,
    setShowForm,
    editRow,
    deleteTarget,
    setDeleteTarget,
    saving,
    deleting,
    handleAdd,
    handleEdit,
    handleDeleteClick,
    handleFormSubmit,
    handleDeleteConfirm,
    reload: load,
  };
}

/**
 * AdminTable — generic table renderer.
 *
 * Props:
 *   columns   : [{ key, label, render? }]
 *   rows      : array
 *   onEdit    : fn(row)
 *   onDelete  : fn(row)
 *   loading   : bool
 *   error     : string
 *   emptyMsg  : string
 */
export function AdminTable({ columns, rows, onEdit, onDelete, loading, error, emptyMsg = "No records found." }) {
  if (loading) {
    return (
      <div className="admin-spinner">
        <div className="admin-spinner__ring" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-empty">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
        <h4>Error loading data</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="admin-empty">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
        <h4>No Records</h4>
        <p>{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((c) => (
                <td key={c.key} title={String(row[c.key] ?? "—")}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? <span style={{ color: "#94a3b8" }}>—</span>)}
                </td>
              ))}
              <td>
                <div className="admin-table-actions">
                  {onEdit && (
                    <button
                      className="admin-action-btn admin-action-btn--edit"
                      onClick={() => onEdit(row)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="admin-action-btn admin-action-btn--delete"
                      onClick={() => onDelete(row)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * ConfirmDeleteModal — reusable delete confirmation dialog.
 */
export function ConfirmDeleteModal({ target, label, onConfirm, onCancel, deleting }) {
  if (!target) return null;
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div
        className="admin-modal admin-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal__body">
          <div className="admin-confirm-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h4>Delete {label}?</h4>
          <p>
            This action is permanent and cannot be undone. The record will be
            permanently removed from the database.
          </p>
        </div>
        <div className="admin-modal__footer">
          <button className="admin-btn-outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className="admin-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminToast — positioned toast notification.
 */
export function AdminToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="admin-toast-wrap">
      <div className={`admin-toast admin-toast--${toast.type}`}>
        {toast.message}
      </div>
    </div>
  );
}

/**
 * TablePageHeader — section header with Add button and search box.
 */
export function TablePageHeader({ title, description, onAdd, addLabel = "Add New", search, onSearch }) {
  return (
    <>
      <div className="admin-section-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {onAdd && (
          <button className="admin-btn-primary" onClick={onAdd} id={`admin-add-${title.replace(/\s+/g, "-").toLowerCase()}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {addLabel}
          </button>
        )}
      </div>

      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__search">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search records…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              id="admin-table-search"
            />
          </div>
        </div>
      </div>
    </>
  );
}
