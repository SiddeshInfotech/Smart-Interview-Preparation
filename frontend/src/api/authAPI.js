import api from "./axios";

export const register = (data) => api.post("/auth/register/", data);
export const sendRegistrationOTP = (email) => api.post("/auth/send-registration-otp/", { email });
export const verifyRegistrationOTP = (email, otp) => api.post("/auth/verify-registration-otp/", { email, otp });
export const login = (data) => api.post("/auth/login/", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password/", data);
export const verifyOTP = (data) => api.post("/auth/verify-otp/", data);
export const resetPassword = (data) => api.post("/auth/reset-password/", data);
export const getProfile = () => api.get("/auth/profile/");
