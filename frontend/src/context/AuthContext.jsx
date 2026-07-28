import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const STORAGE_PROFILE_KEY = "cached_user_profile";
const STORAGE_ROLE_KEY = "user_role";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);

  // Initialize profile from cached localStorage to prevent visual flashes
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("Error reading cached profile", e);
    }
    return {
      name: localStorage.getItem("user_name") || "User",
      email: "",
      profilePicture: null,
      role: localStorage.getItem(STORAGE_ROLE_KEY) || "candidate",
    };
  });

  const [notifications, setNotifications] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const clearAuthCaches = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    localStorage.removeItem("full_name");
    localStorage.removeItem("user_name");
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    localStorage.removeItem("cached_candidate_profile");
    localStorage.removeItem("cached_interviewer_profile");
  };

  // Helper to sync profile state with localStorage
  const updateCachedProfile = (newProfile) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
      if (newProfile.role) {
        localStorage.setItem(STORAGE_ROLE_KEY, newProfile.role);
      }
    } catch (e) {
      console.error("Failed to save profile cache", e);
    }
  };

  // Fetch complete profile details authoritatively from /auth/profile/
  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("access_token");
    if (!currentToken) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    try {
      // 1. Always fetch authoritative user profile from auth endpoint first
      const authRes = await api.get("/auth/profile/");
      if (authRes.data) {
        const name = authRes.data.full_name || authRes.data.name || "User";
        const email = authRes.data.email || "";
        const role = authRes.data.role || localStorage.getItem(STORAGE_ROLE_KEY) || "candidate";

        let profilePic = null;
        const roleEndpoint = role === "interviewer" ? "/interviewer/profile/" : "/candidate/profile/";

        try {
          const roleRes = await api.get(roleEndpoint);
          if (roleRes.data?.profile_picture) {
            const pic = roleRes.data.profile_picture;
            profilePic = pic.startsWith("http") ? pic : `http://127.0.0.1:8000${pic}`;
          }
        } catch (roleErr) {
          console.warn("Role profile fetch warning:", roleErr);
        }

        const updated = { name, email, profilePicture: profilePic, role };
        updateCachedProfile(updated);

        // Keep localStorage user object updated for legacy/direct components
        localStorage.setItem("user", JSON.stringify({
          ...authRes.data,
          full_name: name,
          email: email,
          role: role,
          has_premium: authRes.data.has_premium ?? false,
        }));
      }
    } catch (error) {
      console.error("Error fetching authoritative profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    const currentToken = localStorage.getItem("access_token");
    if (!currentToken) return;

    try {
      const res = await api.get("/notifications/");
      setNotifications(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Login handler to clear old caches and load new user state
  const loginUser = async (loginData) => {
    clearAuthCaches();

    const accessToken = loginData.access_token;
    const refreshToken = loginData.refresh_token;

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    let role = loginData.user?.role;
    if (!role && accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        role = payload.role;
      } catch (e) {}
    }
    role = role || "candidate";
    localStorage.setItem("user_role", role);

    const userObj = loginData.user || {
      full_name: "User",
      email: "",
      role: role,
    };
    localStorage.setItem("user", JSON.stringify(userObj));

    setToken(accessToken || null);
    setUserProfile({
      name: userObj.full_name || userObj.name || "User",
      email: userObj.email || "",
      profilePicture: null,
      role: role,
    });

    // Fetch authoritative backend profile for the newly logged in user
    await fetchProfile();
    await fetchNotifications();
  };

  // Initial load on mount or auth change
  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchNotifications();

      const interval = setInterval(fetchNotifications, 30000);
      const onNotifUpdate = () => fetchNotifications();
      window.addEventListener("notificationUpdate", onNotifUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("notificationUpdate", onNotifUpdate);
      };
    }
  }, [token, fetchProfile, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`, { notification_id: id });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const logout = () => {
    clearAuthCaches();
    setToken(null);
    setUserProfile({ name: "User", email: "", profilePicture: null, role: "candidate" });
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        userProfile,
        setUserProfile: updateCachedProfile,
        loadingProfile,
        notifications,
        unreadCount,
        loadingNotifications,
        fetchProfile,
        fetchNotifications,
        loginUser,
        markAsRead,
        markAllAsRead,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
