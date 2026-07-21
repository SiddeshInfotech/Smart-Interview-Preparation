import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Otp.css";
import {
  verifyOTP,
  forgotPassword,
  verifyRegistrationOTP,
  sendRegistrationOTP,
} from "../api/axios";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 119;

export default function OTP() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which flow we are in: "registration" or "reset" (default)
  const flow = location.state?.flow || "reset";

  const [email, setEmail] = useState(() => {
    if (location.state?.email) return location.state.email;
    return localStorage.getItem("reset_email") || "";
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!email) {
      setError("Email not found. Please try again.");
      const timeout = setTimeout(() => navigate("/forgot-password"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    if (email) inputsRef.current[0]?.focus();
  }, [email]);

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const setDigit = (index, value) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) {
      setDigit(index, "");
      return;
    }
    const char = value[value.length - 1];
    setDigit(index, char);
    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (error) setError("");
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, OTP_LENGTH)
      .split("");
    if (pasted.length === 0) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.forEach((d, i) => (next[i] = d));
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isComplete || !email || submittedRef.current) return;
    submittedRef.current = true;

    setVerifying(true);
    setError("");
    setSuccess("");

    try {
      if (flow === "registration") {
        // Registration OTP verification
        await verifyRegistrationOTP(email, code);
        setSuccess("Email verified successfully! Redirecting...");
        setTimeout(() => {
          navigate("/login", { state: { email } }); // or to registration completion
        }, 1500);
      } else {
        // Password reset OTP verification
        await verifyOTP({ email, otp: code });
        setSuccess("OTP verified successfully! Redirecting...");
        localStorage.setItem("reset_email", email);
        setTimeout(() => {
          navigate("/reset-password", { state: { email } });
          localStorage.removeItem("reset_email");
        }, 1500);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      let errorMessage = "Invalid OTP. Please try again.";
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.response?.data?.error) errorMessage = err.response.data.error;
      else if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      setError(errorMessage);
      submittedRef.current = false;
      setTimeout(() => setError(""), 5000);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending || !email) return;

    setResending(true);
    setError("");
    setSuccess("");

    try {
      if (flow === "registration") {
        await sendRegistrationOTP(email);
      } else {
        await forgotPassword({ email });
      }
      setSuccess("New OTP sent successfully!");
      setTimer(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Resend OTP error:", err);
      let errorMessage = "Failed to resend OTP. Please try again.";
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (isComplete && !verifying && email && !submittedRef.current) {
      handleVerify();
    }
    // eslint-disable-next-line
  }, [isComplete, email]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("reset_email");
    };
  }, []);

  if (!email) {
    return (
      <div className="otp-screen">
        <div className="otp-card">
          <div className="otp-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="otp-title">Error</h1>
          <p className="otp-subtitle" style={{ color: "#dc3545" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-screen">
      <div className="otp-card">
        <div className="otp-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="otp-title">
          {flow === "registration" ? "Email Verification" : "Password Verification"}
        </h1>
        <p className="otp-subtitle">
          {flow === "registration"
            ? `We've sent a 6‑digit code to ${email}. Enter it to verify your email.`
            : `We've sent a 6‑digit code to ${email}. Enter it to reset your password.`}
        </p>

        {error && <div className="otp-error" role="alert">{error}</div>}
        {success && <div className="otp-success" role="status">{success}</div>}

        <div className="otp-inputs" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <React.Fragment key={i}>
              <input
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`otp-box ${digit ? "filled" : ""}`}
                aria-label={`Digit ${i + 1}`}
                disabled={verifying || !!success}
              />
              {i === 2 && <span className="otp-dash">–</span>}
            </React.Fragment>
          ))}
        </div>

        <button
          className="otp-verify-btn"
          disabled={!isComplete || verifying || !!success || !email}
          onClick={handleVerify}
        >
          {verifying ? "Verifying..." : success ? "Verified ✓" : "Verify OTP"}
        </button>

        <p className="otp-resend">
          Didn't receive the code?{" "}
          {timer > 0 ? (
            <span className="otp-resend-disabled">
              Resend code (available in {formatTime(timer)})
            </span>
          ) : (
            <button
              className="otp-resend-link"
              onClick={handleResend}
              disabled={resending || !!success}
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
        </p>

        <button
          type="button"
          className="otp-back-link"
          onClick={() => navigate(flow === "registration" ? "/register" : "/forgot-password")}
        >
          ← Back to {flow === "registration" ? "Registration" : "Forgot Password"}
        </button>
      </div>
    </div>
  );
}
