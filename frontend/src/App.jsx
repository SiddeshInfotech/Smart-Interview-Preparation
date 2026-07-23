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
import CandidateProfile from "./pages/CandidateProfile";
import Quiz from "./pages/Quiz";
import QuizPage from "./pages/QuizPage";
import QuizResult from "./pages/QuizResult";
import FeedbackForm from "./pages/FeedbackForm";
import Interview from "./pages/Interview";
import AppShell from "./components/AppShell";
import RequireRole from "./components/RequireRole";
import InterviewPage from "./pages/InterviewPage";

// ── Admin Panel ────────────────────────────────────────────
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminRoute from "./components/AdminRoute";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/interviewer-profile" element={<InterviewerProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />        
          <Route path="/Auth-page" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/candidate-profile" element={<CandidateProfile />} />
          
          {/* Quiz routes – candidate only */}
          <Route element={<RequireRole allowedRoles={["candidate"]} redirectTo="/dashboard" />}>
            <Route path="/quiz-page" element={<QuizPage />} />
            <Route path="/quiz-result" element={<QuizResult />} />
          </Route>

          {/* Interview Page - Direct Access (Testing Only) */}
          <Route path="/interview-page" element={<InterviewPage />} />

          <Route element={<AppShell />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="resume-upload" element={<ResumeUpload />} />
            <Route path="profile" element={<Profile />} />
            <Route path="feedback-form" element={<FeedbackForm />} />
            
            {/* Quiz – candidate only */}
            <Route element={<RequireRole allowedRoles={["candidate"]} redirectTo="/dashboard" />}>
              <Route path="quiz" element={<Quiz />} />
            </Route>
            
            {/* Interview – both candidate and interviewer */}
            <Route element={<RequireRole allowedRoles={["candidate", "interviewer"]} redirectTo="/dashboard" />}>
              <Route path="interview" element={<Interview />} />
            </Route>
          </Route>

          {/* ── Admin Panel ─────────────────────────── */}
          <Route path="/my_admin_panel/login" element={<AdminLogin />} />
          <Route element={<AdminRoute />}>
            <Route path="/my_admin_panel/*" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;