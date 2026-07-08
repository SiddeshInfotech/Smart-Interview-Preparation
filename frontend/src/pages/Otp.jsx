import React, { useState, useRef, useEffect } from "react";
import "../styles/OTP.css";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 119;

export default function OTP() {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

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

  const handleVerify = () => {
    if (!isComplete) return;
    setVerifying(true);
    // Replace with your actual verification call:
    // await verifyOtp(code)
    setTimeout(() => setVerifying(false), 1200);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="otp-screen">
      <div className="otp-card">
        <div className="otp-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <h1 className="otp-title">Verification required</h1>
        <p className="otp-subtitle">
          We've sent a 6-digit code to your registered email.
          <br />
          Enter it below to finish setting up your profile.
        </p>

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
              />
              {i === 2 && <span className="otp-dash">–</span>}
            </React.Fragment>
          ))}
        </div>

        <button
          className="otp-verify-btn"
          disabled={!isComplete || verifying}
          onClick={handleVerify}
        >
          {verifying ? "Verifying..." : "Verify account"}
        </button>

        <p className="otp-resend">
          Didn't receive the code?{" "}
          {timer > 0 ? (
            <span className="otp-resend-disabled">
              Resend code (available in {formatTime(timer)})
            </span>
          ) : (
            <button className="otp-resend-link" onClick={handleResend}>
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  );
}