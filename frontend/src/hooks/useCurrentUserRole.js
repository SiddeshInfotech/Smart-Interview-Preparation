import { useEffect, useState } from "react";
import api from "../api/authAPI";

const readStoredRole = () => localStorage.getItem("user_role") || "";

export default function useCurrentUserRole() {
  const [role, setRole] = useState(readStoredRole);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("access_token")) && !readStoredRole());

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setRole("");
      setLoading(false);
      return;
    }

    const storedRole = readStoredRole();
    if (storedRole) {
      setRole(storedRole);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRole = async () => {
      try {
        const res = await api.get("/auth/profile/");
        const nextRole = res.data?.role || "";
        if (!cancelled) {
          setRole(nextRole);
          if (nextRole) {
            localStorage.setItem("user_role", nextRole);
          }
        }
      } catch {
        if (!cancelled) {
          setRole("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    role,
    loading,
    isAuthenticated: Boolean(localStorage.getItem("access_token")),
    setRole,
  };
}
