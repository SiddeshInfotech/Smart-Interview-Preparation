import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatMediaUrl } from '../api/courseApi';
import '../styles/Dashboard.css';
import NotificationPopup from './NotificationPopup';

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="navbar-container">
        <button className="navbar-brand" onClick={() => navigate('/')}>
          PrepMaster
        </button>
        
        <div className="navbar-icons">
          <NotificationPopup />
          <button className="icon-btn">
            <Settings size={18} />
          </button>
        </div>
        
        <div className="navbar-avatar" ref={dropdownRef}>
          <button className="avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {userProfile.profilePicture ? (
              <img src={formatMediaUrl(userProfile.profilePicture)} alt="Profile" className="avatar-img" />
            ) : (
              <User size={28} />
            )}
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <p className="profile-name">{userProfile.name}</p>
                <p className="profile-email">{userProfile.email}</p>
              </div>
              <hr />
              <button className="profile-dropdown-item" onClick={() => {
                setMenuOpen(false);
                if (userProfile.role === "interviewer") {
                  navigate("/interviewer-profile");
                } else {
                  navigate("/candidate-profile");
                }
              }}>
                View Profile
              </button>
              <button className="profile-dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}