import React, { useMemo, useState, useRef, useEffect } from "react";

/**
 * DynamicTable — Advanced data table with server-side pagination,
 * column sorting, row selection, bulk actions, column visibility toggle,
 * pinned sticky action buttons, and smart cell rendering.
 */

/* ── Smart Cell Renderers ───────────────────────────────────── */

function renderCellValue(value, field) {
  if (value === null || value === undefined || value === "") {
    return <span style={{ color: "var(--admin-ink-faint)" }}>—</span>;
  }

  const type = field?.type || "string";

  switch (type) {
    case "boolean":
      return (
        <span className={`admin-badge ${value ? "admin-badge--success" : "admin-badge--neutral"}`}>
          {value ? "Yes" : "No"}
        </span>
      );

    case "datetime":
      try {
        const d = new Date(value);
        return d.toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
      } catch {
        return String(value);
      }

    case "date":
      try {
        const d = new Date(value);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } catch {
        return String(value);
      }

    case "email":
      return (
        <a href={`mailto:${value}`} style={{ color: "var(--admin-primary)", textDecoration: "none" }}>
          {value}
        </a>
      );

    case "url":
      return (
        <a href={value} target="_blank" rel="noopener noreferrer"
          style={{ color: "var(--admin-primary)", textDecoration: "none", fontSize: "12px" }}>
          {value.length > 30 ? value.slice(0, 30) + "…" : value}
        </a>
      );

    case "image":
    case "file":
      if (typeof value === "string" && value) {
        const isImage = type === "image" || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
        if (isImage) {
          return (
            <img src={value} alt="" style={{
              width: 32, height: 32, borderRadius: 6, objectFit: "cover",
              border: "1px solid var(--admin-border)"
            }} />
          );
        }
        return (
          <a href={value} target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--admin-primary)", fontSize: "12px" }}>
            📎 File
          </a>
        );
      }
      return String(value);

    case "json":
      try {
        const display = typeof value === "object" ? JSON.stringify(value) : String(value);
        return (
          <span title={display} style={{
            fontFamily: "monospace", fontSize: "11px",
            maxWidth: 160, display: "inline-block",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {display.length > 40 ? display.slice(0, 40) + "…" : display}
          </span>
        );
      } catch {
        return String(value);
      }

    case "text":
      return (
        <span title={String(value)}>
          {String(value).length > 50 ? String(value).slice(0, 50) + "…" : String(value)}
        </span>
      );

    case "decimal":
    case "float":
      return typeof value === "number" ? value.toFixed(1) : String(value);

    default:
      return String(value);
  }
}

function SortIcon({ direction }) {
  if (!direction) {
    return (
      <span className="sort-icon">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M8 10l4-4 4 4M8 14l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="sort-icon">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        {direction === "asc" ? (
          <path d="M8 14l4-4 4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

/* ── Column Selector Dropdown Component ────────────────────── */

function ColumnToggleDropdown({ allFields, visibleColumns, onToggleColumn, onShowAll, onResetDefault }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validFields = allFields.filter(f => f.name !== "password" && f.type !== "binary");

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        className="admin-btn-outline"
        style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: 6 }}
        onClick={() => setOpen(!open)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7m0-18H5a2 2 0 00-2 2v14a2 2 0 002 2h7m0-18v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Columns ({visibleColumns ? visibleColumns.size : validFields.length})
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, zIndex: 100,
          background: "var(--admin-surface)", border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius-md)", boxShadow: "var(--admin-shadow-lg)",
          width: 240, padding: 8, marginTop: 4,
          maxHeight: 320, overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px 8px", borderBottom: "1px solid var(--admin-border-soft)", marginBottom: 6 }}>
            <button type="button" className="admin-btn-ghost" style={{ fontSize: 11, padding: "2px 6px" }} onClick={onShowAll}>
              Show All ({validFields.length})
            </button>
            <button type="button" className="admin-btn-ghost" style={{ fontSize: 11, padding: "2px 6px" }} onClick={onResetDefault}>
              Reset
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {validFields.map((field) => {
              const isChecked = visibleColumns ? visibleColumns.has(field.name) : true;
              return (
                <label
                  key={field.name}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                    borderRadius: 6, cursor: "pointer", fontSize: 12,
                    background: isChecked ? "var(--admin-surface-hover)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleColumn(field.name)}
                    style={{ accentColor: "var(--admin-primary)", cursor: "pointer" }}
                  />
                  <span style={{ color: isChecked ? "var(--admin-ink)" : "var(--admin-ink-muted)", fontWeight: isChecked ? 600 : 400 }}>
                    {field.verbose_name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/* ── Main DynamicTable Component ───────────────────────────── */

export default function DynamicTable({
  fields,
  rows,
  loading,
  error,
  pkField = "id",
  selectedIds = new Set(),
  onSelectToggle,
  onSelectAll,
  allSelected = false,
  ordering = "",
  onSort,
  onView,
  onEdit,
  onDelete,
  emptyMsg = "No records found.",
}) {
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(null);

  // Filter valid fields
  const validFields = useMemo(() => {
    if (!fields || !fields.length) return [];
    return fields.filter((f) => f.name !== "password" && f.type !== "binary");
  }, [fields]);

  // Initialize all fields as visible by default
  useEffect(() => {
    if (validFields.length > 0) {
      setVisibleColumns(new Set(validFields.map((f) => f.name)));
    } else {
      setVisibleColumns(null);
    }
  }, [validFields]);

  const toggleColumn = (fieldName) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev || validFields.map(f => f.name));
      if (next.has(fieldName)) {
        if (next.size > 1) next.delete(fieldName); // Keep at least 1 column
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const showAllColumns = () => {
    setVisibleColumns(new Set(validFields.map(f => f.name)));
  };

  const resetDefaultColumns = () => {
    const defaultNames = validFields.slice(0, Math.min(7, validFields.length)).map(f => f.name);
    setVisibleColumns(new Set(defaultNames));
  };

  const displayFields = useMemo(() => {
    if (!validFields.length) return [];
    if (!visibleColumns) return validFields.slice(0, 7);
    return validFields.filter((f) => visibleColumns.has(f.name));
  }, [validFields, visibleColumns]);

  // Current sort state
  const sortField = ordering?.replace(/^-/, "") || "";
  const sortDir = ordering?.startsWith("-") ? "desc" : ordering ? "asc" : "";

  if (loading) {
    return (
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i}><div className="admin-skeleton admin-skeleton--text" style={{ width: "60%" }}></div></th>
              ))}
              <th className="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td><div className="admin-skeleton" style={{ width: 15, height: 15 }}></div></td>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j}><div className="admin-skeleton admin-skeleton--text"></div></td>
                ))}
                <td className="actions-col"><div className="admin-skeleton" style={{ width: 80, height: 24 }}></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-empty">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <h4>Error loading data</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (!rows || !rows.length) {
    return (
      <div className="admin-empty">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <h4>No Records</h4>
        <p>{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Column visibility control bar above table */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", borderBottom: "1px solid var(--admin-border-soft)",
        background: "var(--admin-bg-soft)", fontSize: 12, color: "var(--admin-ink-muted)",
      }}>
        <span>
          Showing <strong>{displayFields.length}</strong> of <strong>{validFields.length}</strong> columns. Scroll horizontally to view extra fields.
        </span>
        <ColumnToggleDropdown
          allFields={validFields}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
          onShowAll={showAllColumns}
          onResetDefault={resetDefaultColumns}
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {onSelectToggle && (
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                  />
                </th>
              )}
              {displayFields.map((field) => {
                const isSortable = !["json", "manytomany"].includes(field.type);
                const isSorted = sortField === field.name;
                return (
                  <th
                    key={field.name}
                    className={`${isSortable ? "sortable" : ""} ${isSorted ? "sorted" : ""}`}
                    onClick={() => {
                      if (!isSortable || !onSort) return;
                      if (isSorted && sortDir === "asc") {
                        onSort(`-${field.name}`);
                      } else if (isSorted && sortDir === "desc") {
                        onSort("");
                      } else {
                        onSort(field.name);
                      }
                    }}
                  >
                    {field.verbose_name}
                    {isSortable && <SortIcon direction={isSorted ? sortDir : null} />}
                  </th>
                );
              })}
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pk = row[pkField];
              const isSelected = selectedIds.has(pk);
              return (
                <tr key={pk} className={isSelected ? "selected" : ""}>
                  {onSelectToggle && (
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectToggle(pk)}
                      />
                    </td>
                  )}
                  {displayFields.map((field) => (
                    <td key={field.name} title={String(row[field.name] ?? "")}>
                      {renderCellValue(row[field.name], field)}
                    </td>
                  ))}
                  <td className="actions-col">
                    <div className="admin-table-actions">
                      {onView && (
                        <button className="admin-action-btn admin-action-btn--view" onClick={() => onView(row)} title="View Record">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                          View
                        </button>
                      )}
                      {onEdit && (
                        <button className="admin-action-btn admin-action-btn--edit" onClick={() => onEdit(row)} title="Edit Record">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          </svg>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button className="admin-action-btn admin-action-btn--delete" onClick={() => onDelete(row)} title="Delete Record">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Pagination Component ─────────────────────────────────── */

export function Pagination({ count, pageSize = 25, currentPage = 1, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, count);

  // Generate page numbers to show
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="admin-pagination">
      <div className="admin-pagination__info">
        Showing {start}–{end} of {count} records
      </div>
      <div className="admin-pagination__controls">
        <button
          className="admin-pagination__btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ‹
        </button>
        {startPage > 1 && (
          <>
            <button className="admin-pagination__btn" onClick={() => onPageChange(1)}>1</button>
            {startPage > 2 && <span style={{ color: "var(--admin-ink-muted)", fontSize: 12, padding: "0 4px" }}>…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            className={`admin-pagination__btn ${p === currentPage ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={{ color: "var(--admin-ink-muted)", fontSize: 12, padding: "0 4px" }}>…</span>}
            <button className="admin-pagination__btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}
        <button
          className="admin-pagination__btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
