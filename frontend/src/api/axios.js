// src/api/axios.js
import axios from "axios";

// 1️⃣ Create the Axios instance with dynamic base URL
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL });

// 2️⃣ Attach the JWT token interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    const publicEndpoints = [
        "/auth/register/",
        "/auth/login/",
        "/auth/send-registration-otp/",
        "/auth/verify-registration-otp/",
        "/auth/forgot-password/",
        "/auth/verify-otp/",
        "/auth/reset-password/",
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        config.url.includes(endpoint)
    );

    if (token && !isPublicEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3️⃣ Export all API functions (from axios)
export const register = (data) => api.post("/auth/register/", data);
export const sendRegistrationOTP = (email) =>
    api.post("/auth/send-registration-otp/", { email });
export const verifyRegistrationOTP = (email, otp) =>
    api.post("/auth/verify-registration-otp/", { email, otp });
export const login = (data) => api.post("/auth/login/", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password/", data);
export const verifyOTP = (data) => api.post("/auth/verify-otp/", data);
export const resetPassword = (data) => api.post("/auth/reset-password/", data);
export const getProfile = () => api.get("/auth/profile/");
export const submitFeedback = (data) => api.post("/feedback/", data);

// 4️⃣ Default export (the Axios instance)
export default api;