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

  // Fetch complete profile details (Auth profile + Candidate/Interviewer picture)
  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("access_token");
    if (!currentToken) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    let name = userProfile.name || "User";
    let email = userProfile.email || "";
    let profilePic = userProfile.profilePicture || null;
    let role = userProfile.role || "candidate";

    try {
      const authRes = await api.get("/auth/profile/");
      if (authRes.data) {
        name = authRes.data.full_name || name;
        email = authRes.data.email || email;
        role = authRes.data.role || role;
      }
    } catch (error) {
      console.error("Error fetching auth profile:", error);
    }

    try {
      if (role === "interviewer") {
        const intRes = await api.get("/interviewer/profile/");
        if (intRes.data && intRes.data.profile_picture) {
          const pic = intRes.data.profile_picture;
          profilePic = pic.startsWith("http") ? pic : `http://127.0.0.1:8000${pic}`;
        }
      } else {
        const candRes = await api.get("/candidate/profile/");
        if (candRes.data && candRes.data.profile_picture) {
          const pic = candRes.data.profile_picture;
          profilePic = pic.startsWith("http") ? pic : `http://127.0.0.1:8000${pic}`;
        }
      }
    } catch (error) {
      console.error("Error fetching role profile picture:", error);
    }

    const updated = { name, email, profilePicture: profilePic, role };
    updateCachedProfile(updated);
    setLoadingProfile(false);
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

  // Initial load on mount or auth change
  useEffect(() => {
    const currentToken = localStorage.getItem("access_token");
    if (currentToken) {
      fetchProfile();
      fetchNotifications();

      // Poll notifications gently every 30s
      const interval = setInterval(fetchNotifications, 30000);
      const onNotifUpdate = () => fetchNotifications();
      window.addEventListener("notificationUpdate", onNotifUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("notificationUpdate", onNotifUpdate);
      };
    }
  }, [fetchProfile, fetchNotifications]);

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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem(STORAGE_PROFILE_KEY);
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
