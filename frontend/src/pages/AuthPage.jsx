import React, { useState } from "react";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import "../styles/Auth.css";

// This is the piece that was missing: something has to hold
// "which screen am I on" and swap the component out.
export default function AuthPage() {
  const [view, setView] = useState("login"); // "login" | "forgot"

  return (
    <div className="auth-page">
      {view === "login" && (
        <Login
          onForgotPassword={() => setView("forgot")}
          onSignIn={(data) => console.log("sign in", data)}
          onSignUp={() => console.log("go to sign up")}
        />
      )}

      {view === "forgot" && (
        <ForgotPassword
          onBack={() => setView("login")}
          onCodeSent={(email) => {
            console.log("code sent to", email);
            // navigate to your OTP page here
          }}
        />
      )}
    </div>
  );
}