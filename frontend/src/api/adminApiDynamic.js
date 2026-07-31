/**
 * adminApiDynamic.js — Frontend API client for the Dynamic Admin Engine
 *
 * All calls hit the new /api/admin/ endpoints.
 * Uses the same auth interceptor pattern as the existing adminApi.js.
 */

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const dynamicApi = axios.create({ baseURL });

// Attach admin JWT token
dynamicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403
dynamicApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response &&
      (err.response.status === 401 || err.response.status === 403)
    ) {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_user");
      if (!window.location.pathname.includes("/my_admin_panel/login")) {
        window.location.href = "/my_admin_panel/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Model Discovery ─────────────────────────────────────────

/** Fetch all registered models grouped by app */
export const fetchModels = () => dynamicApi.get("/admin/models/");

/** Fetch detailed field metadata for a single model */
export const fetchModelMeta = (appLabel, modelName) =>
  dynamicApi.get(`/admin/models/${appLabel}/${modelName}/`);

// ── Dashboard ───────────────────────────────────────────────

export const fetchDashboardStats = () => dynamicApi.get("/admin/dashboard/");

// ── Generic CRUD ────────────────────────────────────────────

/**
 * Fetch paginated records for a model.
 * @param {string} appLabel
 * @param {string} modelName
 * @param {Object} params - { page, page_size, search, ordering, filter_<field> }
 */
export const fetchRecords = (appLabel, modelName, params = {}) =>
  dynamicApi.get(`/admin/${appLabel}/${modelName}/`, { params });

/** Fetch a single record */
export const fetchRecord = (appLabel, modelName, pk) =>
  dynamicApi.get(`/admin/${appLabel}/${modelName}/${pk}/`);

/** Create a new record */
export const createRecord = (appLabel, modelName, data) =>
  dynamicApi.post(`/admin/${appLabel}/${modelName}/`, data);

/** Update a record (full replacement) */
export const updateRecord = (appLabel, modelName, pk, data) =>
  dynamicApi.put(`/admin/${appLabel}/${modelName}/${pk}/`, data);

/** Partially update a record */
export const patchRecord = (appLabel, modelName, pk, data) =>
  dynamicApi.patch(`/admin/${appLabel}/${modelName}/${pk}/`, data);

/** Delete a single record */
export const deleteRecord = (appLabel, modelName, pk) =>
  dynamicApi.delete(`/admin/${appLabel}/${modelName}/${pk}/`);

// ── Bulk Actions ────────────────────────────────────────────

/** Bulk delete records */
export const bulkDelete = (appLabel, modelName, ids) =>
  dynamicApi.post(`/admin/${appLabel}/${modelName}/bulk-delete/`, { ids });

// ── FK Options ──────────────────────────────────────────────

/** Fetch FK dropdown options */
export const fetchFkOptions = (appLabel, modelName, fieldName, search = "") =>
  dynamicApi.get(
    `/admin/${appLabel}/${modelName}/fk-options/${fieldName}/`,
    { params: { search, limit: 50 } }
  );

// ── History / Audit ─────────────────────────────────────────

/** Fetch audit log for a specific record */
export const fetchHistory = (appLabel, modelName, pk) =>
  dynamicApi.get(`/admin/${appLabel}/${modelName}/${pk}/history/`);

export default dynamicApi;
