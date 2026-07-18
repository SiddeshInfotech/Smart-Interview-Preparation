import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCurrentUserRole from "../hooks/useCurrentUserRole";

export default function RequireRole({ allowedRoles = [], redirectTo = "/dashboard" }) {
  const location = useLocation();
  const { role, loading, isAuthenticated } = useCurrentUserRole();

  if (loading) {
    return <div style={{ padding: "32px", color: "#64748b" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
