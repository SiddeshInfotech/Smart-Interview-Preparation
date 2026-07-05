import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CandidateProfile from "./pages/CandidateProfile";
import ResumeUpload from "./pages/ResumeUpload";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/candidate-profile" element={<CandidateProfile />} />
        <Route path="/resume-upload" element={<ResumeUpload />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;