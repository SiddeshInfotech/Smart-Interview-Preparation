import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Route guard for admin-only pages.
 * Reads `admin_access_token` from localStorage.
 * Redirects to /my_admin_panel/login if no valid token is found.
 */
export default function AdminRoute() {
  const token = localStorage.getItem("admin_access_token");
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/my_admin_panel/login" replace />;
  }
  return <Outlet />;
}
