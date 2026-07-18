import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import "../styles/Auth.css";
import { resetPassword } from "../api/authAPI";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(() => {
        return location.state?.email || localStorage.getItem("reset_email") || "";
    });

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            setError("Email not found. Please start over.");
            setTimeout(() => navigate("/forgot-password"), 2000);
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await resetPassword({
                email,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            setSuccess("Password reset successfully! Redirecting to login...");
            localStorage.removeItem("reset_email");

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            console.error("Reset password error:", err);
            const msg = err.response?.data?.message || "Failed to reset password. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h1 className="auth-title">Error</h1>
                    <p className="auth-subtitle" style={{ color: "#dc3545" }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Set New Password</h1>
                <p className="auth-subtitle">
                    For <strong>{email}</strong><br />
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Password fields with eye toggle */}
                    <label className="field-label" htmlFor="newPassword">New Password</label>
                    <div className="input-wrap">
                        <Lock size={18} className="input-icon" />
                        <input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <label className="field-label" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-wrap">
                        <Lock size={18} className="input-icon" />
                        <input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && <div className="field-error" style={{ whiteSpace: "pre-line" }}>{error}</div>}
                    {success && (
                        <div className="field-success">
                            <CheckCircle size={16} />
                            {success}
                        </div>
                    )}

                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="auth-footer">
                    <button type="button" className="text-link" onClick={() => navigate("/login")}>
                        ← Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
}