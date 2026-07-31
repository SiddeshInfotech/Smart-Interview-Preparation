import React, { useMemo } from "react";

/**
 * DynamicTable — Advanced data table with server-side pagination,
 * column sorting, row selection, bulk actions, and smart cell rendering.
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
          {value.length > 35 ? value.slice(0, 35) + "…" : value}
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
            maxWidth: 200, display: "inline-block",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {display.length > 50 ? display.slice(0, 50) + "…" : display}
          </span>
        );
      } catch {
        return String(value);
      }

    case "text":
      return (
        <span title={String(value)}>
          {String(value).length > 60 ? String(value).slice(0, 60) + "…" : String(value)}
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
  // Determine which fields to show as columns (skip large text, json, etc.)
  const displayFields = useMemo(() => {
    if (!fields || !fields.length) return [];
    return fields.filter((f) => {
      if (f.type === "auto" && f.is_primary_key) return true;  // always show PK
      if (f.type === "json" || f.type === "binary") return false;
      if (f.type === "text" && f.name !== "skills") return false; // skip large text fields in table
      if (f.name === "password") return false;
      return true;
    }).slice(0, 10); // max 10 columns
  }, [fields]);

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
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i}><div className="admin-skeleton admin-skeleton--text" style={{ width: "60%" }}></div></th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td><div className="admin-skeleton" style={{ width: 15, height: 15 }}></div></td>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j}><div className="admin-skeleton admin-skeleton--text"></div></td>
                ))}
                <td><div className="admin-skeleton" style={{ width: 60, height: 24 }}></div></td>
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
            <th>Actions</th>
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
                <td>
                  <div className="admin-table-actions">
                    {onView && (
                      <button className="admin-action-btn admin-action-btn--view" onClick={() => onView(row)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button className="admin-action-btn admin-action-btn--edit" onClick={() => onEdit(row)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button className="admin-action-btn admin-action-btn--delete" onClick={() => onDelete(row)}>
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
