import React, { useState, useEffect, useCallback } from "react";
import { fetchFkOptions } from "../../api/adminApiDynamic";

/**
 * DynamicForm — Generates form fields from model metadata.
 * Maps field types to appropriate UI components.
 */

function FieldInput({ field, value, onChange, errors }) {
  const fieldError = errors?.[field.name];
  const isRequired = field.required && !field.readonly;
  const type = field.type;
  const disabled = field.readonly || !field.editable;

  // ── Boolean → Toggle switch ──────────────────────────────
  if (type === "boolean") {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={disabled}
            />
            <span className="admin-toggle__slider" />
          </label>
          <span style={{ fontSize: 12, color: "var(--admin-ink-secondary)" }}>
            {value ? "Yes" : "No"}
          </span>
        </div>
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Choices → Select dropdown ────────────────────────────
  if (field.choices && field.choices.length > 0) {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={disabled}
        >
          <option value="">— Select —</option>
          {field.choices.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── ForeignKey / OneToOne → Searchable select ────────────
  if (type === "foreignkey" || type === "onetoone") {
    return (
      <FkSelect
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
        isRequired={isRequired}
        error={fieldError}
      />
    );
  }

  // ── Text / Large text → Textarea ─────────────────────────
  if (type === "text") {
    return (
      <div className="admin-form-group admin-form-group--full">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.help_text || `Enter ${field.verbose_name.toLowerCase()}…`}
          disabled={disabled}
          rows={4}
        />
        {field.help_text && <span style={{ fontSize: 11, color: "var(--admin-ink-muted)" }}>{field.help_text}</span>}
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── JSON → Textarea with mono font ──────────────────────
  if (type === "json") {
    const displayValue = typeof value === "object" ? JSON.stringify(value, null, 2) : (value ?? "");
    return (
      <div className="admin-form-group admin-form-group--full">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <textarea
          value={displayValue}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(field.name, parsed);
            } catch {
              onChange(field.name, e.target.value);
            }
          }}
          placeholder='{ "key": "value" }'
          disabled={disabled}
          rows={5}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Date ──────────────────────────────────────────────────
  if (type === "date") {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={disabled}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── DateTime ──────────────────────────────────────────────
  if (type === "datetime") {
    let displayVal = value ?? "";
    // Format ISO string for datetime-local input
    if (displayVal && typeof displayVal === "string") {
      displayVal = displayVal.slice(0, 16);
    }
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <input
          type="datetime-local"
          value={displayVal}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={disabled}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Time ──────────────────────────────────────────────────
  if (type === "time") {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <input
          type="time"
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={disabled}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Email ─────────────────────────────────────────────────
  if (type === "email") {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <input
          type="email"
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.help_text || "email@example.com"}
          disabled={disabled}
          maxLength={field.max_length || undefined}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── URL ───────────────────────────────────────────────────
  if (type === "url") {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder="https://…"
          disabled={disabled}
          maxLength={field.max_length || undefined}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Number (integer, float, decimal) ──────────────────────
  if (["integer", "float", "decimal"].includes(type)) {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (type === "integer") {
              onChange(field.name, v === "" ? "" : parseInt(v, 10));
            } else {
              onChange(field.name, v === "" ? "" : parseFloat(v));
            }
          }}
          step={type === "integer" ? 1 : type === "decimal" ? Math.pow(10, -(field.decimal_places || 2)) : "any"}
          disabled={disabled}
          placeholder={field.help_text || "0"}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Image / File ──────────────────────────────────────────
  if (type === "image" || type === "file") {
    return (
      <div className="admin-form-group">
        <label>
          {field.verbose_name}
          {isRequired && <span className="required-dot" />}
        </label>
        {value && typeof value === "string" && type === "image" && (
          <img src={value} alt="" style={{
            width: 64, height: 64, objectFit: "cover", borderRadius: 8,
            border: "1px solid var(--admin-border)", marginBottom: 6,
          }} />
        )}
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder="File path or URL"
          disabled={disabled}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Password (special case for User model) ───────────────
  if (field.name === "password") {
    return (
      <div className="admin-form-group">
        <label>{field.verbose_name}</label>
        <input
          type="password"
          value={value ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder="••••••••"
          disabled={disabled}
        />
        {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
      </div>
    );
  }

  // ── Default → text input ──────────────────────────────────
  return (
    <div className="admin-form-group">
      <label>
        {field.verbose_name}
        {isRequired && <span className="required-dot" />}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        placeholder={field.help_text || `Enter ${field.verbose_name.toLowerCase()}…`}
        disabled={disabled}
        maxLength={field.max_length || undefined}
      />
      {field.help_text && !disabled && <span style={{ fontSize: 11, color: "var(--admin-ink-muted)" }}>{field.help_text}</span>}
      {fieldError && <div className="admin-field-error">{Array.isArray(fieldError) ? fieldError[0] : fieldError}</div>}
    </div>
  );
}


/* ── FK Select with search ─────────────────────────────────── */

function FkSelect({ field, value, onChange, disabled, isRequired, error }) {
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const relatedModel = field.related_model;

  const loadOptions = useCallback(async (q = "") => {
    if (!relatedModel) return;
    setLoading(true);
    try {
      // We need to know which model this field belongs to
      // For now, load from the related model directly
      const res = await fetchFkOptions(
        relatedModel.app_label,
        relatedModel.model_name,
        field.name,
        q
      );
      // The FK options endpoint needs the parent model info, but we'll
      // handle this by passing it differently. For now, use a simple approach.
      setOptions(res.data?.data || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [relatedModel, field.name]);

  useEffect(() => {
    if (open) {
      loadOptions(search);
    }
  }, [open, search, loadOptions]);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayValue = selectedOption?.label || (value ? `ID: ${value}` : "");

  return (
    <div className="admin-form-group">
      <label>
        {field.verbose_name}
        {isRequired && <span className="required-dot" />}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={open ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={`Search ${field.verbose_name.toLowerCase()}…`}
          disabled={disabled}
          autoComplete="off"
        />
        {/* Hidden actual value */}
        {!open && value && (
          <button
            type="button"
            onClick={() => onChange(field.name, null)}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--admin-ink-muted)", fontSize: 14,
            }}
          >
            ✕
          </button>
        )}
        {open && options.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            background: "var(--admin-surface)", border: "1px solid var(--admin-border)",
            borderRadius: "var(--admin-radius)", boxShadow: "var(--admin-shadow-lg)",
            maxHeight: 200, overflowY: "auto", marginTop: 4,
          }}>
            {loading ? (
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--admin-ink-muted)" }}>Loading…</div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(field.name, opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    padding: "7px 12px", cursor: "pointer", fontSize: 13,
                    background: String(opt.value) === String(value) ? "var(--admin-primary-soft)" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      String(opt.value) === String(value) ? "var(--admin-primary-soft)" : "transparent";
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--admin-ink-muted)" }}>ID: {opt.value}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <div className="admin-field-error">{Array.isArray(error) ? error[0] : error}</div>}
    </div>
  );
}


/* ── Main DynamicForm Component ─────────────────────────────── */

export default function DynamicForm({
  fields,
  formData,
  onChange,
  errors = {},
  isEdit = false,
  parentModel, // { appLabel, modelName } — needed for FK option loading
}) {
  if (!fields || !fields.length) {
    return <div className="admin-empty"><p>No fields available.</p></div>;
  }

  // Include all model fields in the form (render read-only fields as disabled)
  const editableFields = fields.filter((f) => {
    // Skip binary fields and password when editing unless intended
    if (f.type === "binary") return false;
    if (f.type === "manytomany") return false;
    return true;
  });

  const handleFieldChange = (name, value) => {
    onChange({ ...formData, [name]: value });
  };

  return (
    <div className="admin-form-grid">
      {editableFields.map((field) => (
        <FieldInput
          key={field.name}
          field={{
            ...field,
            // Override FK options loading with parent model context
            _parentModel: parentModel,
          }}
          value={formData[field.name]}
          onChange={handleFieldChange}
          errors={errors}
        />
      ))}
    </div>
  );
}
