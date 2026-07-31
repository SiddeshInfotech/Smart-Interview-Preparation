import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  fetchModelMeta,
  fetchRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  bulkDelete,
} from "../../api/adminApiDynamic";
import DynamicTable, { Pagination } from "./DynamicTable";
import DynamicForm from "./DynamicForm";
import DynamicDetail from "./DynamicDetail";
import { ConfirmDeleteModal, AdminToast } from "./adminUtils";

/**
 * DynamicModelPage — A single component that renders any model's
 * list, detail, and form views based on URL parameters.
 */
export default function DynamicModelPage() {
  const { appLabel, modelName } = useParams();

  // ── Model metadata ──────────────────────────────────────
  const [meta, setMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  // ── List data ───────────────────────────────────────────
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Pagination, search, ordering ────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const searchDebounceRef = useRef(null);

  // ── Row selection ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Modal states ────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null); // null = create, object = edit
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Toast ───────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Derived ─────────────────────────────────────────────
  const pkField = meta?.pk_field || "id";
  const verboseName = meta?.verbose_name || modelName?.replace(/_/g, " ") || "";
  const verboseNamePlural = meta?.verbose_name_plural || verboseName + "s";
  const fields = meta?.fields || [];

  // ── Fetch model metadata ────────────────────────────────
  useEffect(() => {
    if (!appLabel || !modelName) return;
    setMetaLoading(true);
    setMeta(null);
    setRows([]);
    setPage(1);
    setSearch("");
    setOrdering("");
    setSelectedIds(new Set());

    fetchModelMeta(appLabel, modelName)
      .then((res) => {
        setMeta(res.data?.data || null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load model metadata.");
      })
      .finally(() => setMetaLoading(false));
  }, [appLabel, modelName]);

  // ── Fetch records ───────────────────────────────────────
  const loadRecords = useCallback(async () => {
    if (!appLabel || !modelName) return;
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (ordering) params.ordering = ordering;

      const res = await fetchRecords(appLabel, modelName, params);
      const data = res.data?.data;
      setRows(data?.results || []);
      setTotalCount(data?.count || 0);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load records.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [appLabel, modelName, page, pageSize, search, ordering]);

  useEffect(() => {
    if (!metaLoading && meta) {
      loadRecords();
    }
  }, [loadRecords, metaLoading, meta]);

  // ── Search debounce ─────────────────────────────────────
  const handleSearchChange = (value) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  // ── Row selection handlers ──────────────────────────────
  const handleSelectToggle = (pk) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pk)) next.delete(pk);
      else next.add(pk);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((r) => r[pkField])));
    } else {
      setSelectedIds(new Set());
    }
  };

  // ── CRUD handlers ───────────────────────────────────────
  const handleAdd = () => {
    const defaults = {};
    fields.forEach((f) => {
      if (f.default !== null && f.default !== undefined) {
        defaults[f.name] = f.default;
      } else if (f.type === "boolean") {
        defaults[f.name] = false;
      } else {
        defaults[f.name] = "";
      }
    });
    setFormData(defaults);
    setFormErrors({});
    setEditRecord(null);
    setShowForm(true);
  };

  const handleEdit = (row) => {
    const data = { ...row };
    // Remove display fields from form data
    Object.keys(data).forEach((key) => {
      if (key.endsWith("_display")) delete data[key];
    });
    setFormData(data);
    setFormErrors({});
    setEditRecord(row);
    setShowForm(true);
    setViewRecord(null); // close detail if open
  };

  const handleFormSubmit = async () => {
    setSaving(true);
    setFormErrors({});
    try {
      // Clean form data: remove readonly/auto fields
      const cleanData = {};
      fields.forEach((f) => {
        if (f.type === "auto" && f.is_primary_key) return;
        if (f.readonly) return;
        if (f.name in formData && formData[f.name] !== "") {
          cleanData[f.name] = formData[f.name];
        } else if (f.nullable && (formData[f.name] === "" || formData[f.name] === undefined)) {
          cleanData[f.name] = null;
        } else if (f.name in formData) {
          cleanData[f.name] = formData[f.name];
        }
      });

      if (editRecord) {
        await updateRecord(appLabel, modelName, editRecord[pkField], cleanData);
        showToast(`${verboseName} updated successfully.`);
      } else {
        await createRecord(appLabel, modelName, cleanData);
        showToast(`${verboseName} created successfully.`);
      }
      setShowForm(false);
      loadRecords();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setFormErrors(errors);
      } else {
        showToast(err.response?.data?.message || "Operation failed.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(appLabel, modelName, deleteTarget[pkField]);
      showToast(`${verboseName} deleted.`);
      setDeleteTarget(null);
      loadRecords();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await bulkDelete(appLabel, modelName, Array.from(selectedIds));
      showToast(`${selectedIds.size} record(s) deleted.`);
      setSelectedIds(new Set());
      loadRecords();
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk delete failed.", "error");
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── CSV export ──────────────────────────────────────────
  const handleExportCSV = () => {
    if (!rows.length || !fields.length) return;
    const visibleFields = fields.filter((f) => f.type !== "binary" && f.name !== "password");
    const header = visibleFields.map((f) => f.verbose_name).join(",");
    const csvRows = rows.map((row) =>
      visibleFields.map((f) => {
        const val = row[f.name];
        const strVal = val === null || val === undefined ? "" : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appLabel}_${modelName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading state ───────────────────────────────────────
  if (metaLoading) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div className="admin-skeleton admin-skeleton--title" style={{ marginBottom: 8 }}></div>
          <div className="admin-skeleton admin-skeleton--text" style={{ width: "50%" }}></div>
        </div>
        <div className="admin-table-card">
          <div style={{ padding: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-skeleton admin-skeleton--row"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminToast toast={toast} />

      {/* ── Header ────────────────────────────────────── */}
      <div className="admin-section-header">
        <div>
          <h2>{verboseNamePlural}</h2>
          <p>
            Manage all {verboseNamePlural.toLowerCase()} records.
            {totalCount > 0 && ` ${totalCount} total.`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="admin-btn-outline" onClick={handleExportCSV} disabled={!rows.length}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
          <button className="admin-btn-primary" onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add {verboseName}
          </button>
        </div>
      </div>

      {/* ── Table Card ────────────────────────────────── */}
      <div className="admin-table-card">
        {/* Toolbar */}
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__left">
            <div className="admin-table-toolbar__search">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                placeholder={`Search ${verboseNamePlural.toLowerCase()}…`}
                defaultValue={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                id="admin-table-search"
              />
            </div>
          </div>
          <div className="admin-table-toolbar__right">
            <span className="admin-table-toolbar__meta">
              {totalCount} record{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="admin-bulk-bar">
            <span className="admin-bulk-bar__count">
              {selectedIds.size} selected
            </span>
            <div className="admin-bulk-bar__actions">
              <button
                className="admin-btn-ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
              <button
                className="admin-btn-danger"
                style={{ fontSize: 12, padding: "5px 12px" }}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? "Deleting…" : `Delete ${selectedIds.size}`}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <DynamicTable
          fields={fields}
          rows={rows}
          loading={loading}
          error={error}
          pkField={pkField}
          selectedIds={selectedIds}
          onSelectToggle={handleSelectToggle}
          onSelectAll={handleSelectAll}
          allSelected={rows.length > 0 && rows.every((r) => selectedIds.has(r[pkField]))}
          ordering={ordering}
          onSort={(ord) => { setOrdering(ord); setPage(1); }}
          onView={(row) => setViewRecord(row)}
          onEdit={handleEdit}
          onDelete={(row) => setDeleteTarget(row)}
          emptyMsg={`No ${verboseNamePlural.toLowerCase()} found.`}
        />

        {/* Pagination */}
        <Pagination
          count={totalCount}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>

      {/* ── Create/Edit Modal ─────────────────────────── */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editRecord ? `Edit ${verboseName}` : `Add ${verboseName}`}</h3>
              <button className="admin-modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <DynamicForm
                fields={fields}
                formData={formData}
                onChange={setFormData}
                errors={formErrors}
                isEdit={!!editRecord}
                parentModel={{ appLabel, modelName }}
              />
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="admin-btn-primary" onClick={handleFormSubmit} disabled={saving}>
                {saving ? "Saving…" : editRecord ? `Update ${verboseName}` : `Create ${verboseName}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail View ───────────────────────────────── */}
      {viewRecord && (
        <DynamicDetail
          fields={fields}
          record={viewRecord}
          appLabel={appLabel}
          modelName={modelName}
          pkField={pkField}
          onEdit={handleEdit}
          onClose={() => setViewRecord(null)}
        />
      )}

      {/* ── Delete Confirm ────────────────────────────── */}
      <ConfirmDeleteModal
        target={deleteTarget}
        label={verboseName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </>
  );
}
