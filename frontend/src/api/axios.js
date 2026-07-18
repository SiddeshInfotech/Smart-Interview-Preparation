import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
});

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
    "/feedback/"
  ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url.includes(endpoint));

    if (token && !isPublicEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;