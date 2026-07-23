import { useAuth } from "../context/AuthContext";

export default function useCurrentUserRole() {
  const { userProfile, loadingProfile } = useAuth();

  const role = userProfile?.role || localStorage.getItem("user_role") || "";

  return {
    role,
    loading: loadingProfile && !role,
    isAuthenticated: Boolean(localStorage.getItem("access_token")),
  };
}
