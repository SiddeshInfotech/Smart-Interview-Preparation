import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import Otp from "./pages/Otp";
import RoleSelection from "./pages/RoleSelection";
import InterviewerProfile from "./pages/InterviewerProfile";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import CP from "./pages/CP";
import Quiz from "./pages/Quiz";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume-upload" element={<ResumeUpload />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/interviewer-profile" element={<InterviewerProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/Auth-page" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/CP" element={<CP />} />
        <Route path="/quiz" element={<Quiz/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;