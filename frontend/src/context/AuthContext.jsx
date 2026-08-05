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

  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_notifications");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
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
    localStorage.removeItem("cached_dashboard_quiz");
    localStorage.removeItem("cached_dashboard_interview");
    localStorage.removeItem("cached_dashboard_coding");
    localStorage.removeItem("cached_dashboard_ai");
    localStorage.removeItem("cached_dashboard_daily_progress");
    localStorage.removeItem("cached_user_usage");
    localStorage.removeItem("cached_notifications");
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
  // Fetch complete profile details authoritatively in a single unified request
  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("access_token");
    if (!currentToken) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    try {
      const role = localStorage.getItem(STORAGE_ROLE_KEY) || "candidate";
      const roleEndpoint = role === "interviewer" ? "/interviewer/profile/" : "/candidate/profile/";

      let profileRes = null;
      try {
        profileRes = await api.get(roleEndpoint);
      } catch (err) {
        // Fallback to auth profile if role endpoint fails
        profileRes = await api.get("/auth/profile/");
      }

      if (profileRes?.data) {
        const name = profileRes.data.full_name || profileRes.data.name || "User";
        const email = profileRes.data.email || "";
        let profilePic = null;
        if (profileRes.data.profile_picture) {
          const pic = profileRes.data.profile_picture;
          profilePic = pic.startsWith("http") ? pic : `http://127.0.0.1:8000${pic}`;
        }

        const updated = { name, email, profilePicture: profilePic, role };
        updateCachedProfile(updated);

        localStorage.setItem("user", JSON.stringify({
          ...profileRes.data,
          full_name: name,
          email: email,
          role: role,
          has_premium: profileRes.data.has_premium ?? false,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifications(data);
      localStorage.setItem("cached_notifications", JSON.stringify(data));
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Login handler to clear old caches and load new user state instantly
  const loginUser = (loginData) => {
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

    setUserProfile({
      name: userObj.full_name || userObj.name || "User",
      email: userObj.email || "",
      profilePicture: null,
      role: role,
    });
    setToken(accessToken || null);
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
