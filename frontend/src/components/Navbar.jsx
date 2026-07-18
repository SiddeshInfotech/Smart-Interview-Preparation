import React, { useState, useEffect, useRef } from 'react';
import { Settings, User } from 'lucide-react';
import api from '../api/authAPI';
import '../styles/Dashboard.css';
import NotificationPopup from './NotificationPopup';

export default function Navbar() {
  const [userProfile, setUserProfile] = useState({
    name: 'Loading...',
    email: '',
    profilePicture: null,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  console.log('Navbar rendered with NotificationPopup'); // Debug log

  useEffect(() => {
    const fetchProfile = async () => {
      let name = 'User';
      let email = '';
      let pic = null;
      try {
        const authRes = await api.get('/auth/profile/');
        if (authRes.data) {
          name = authRes.data.full_name || name;
          email = authRes.data.email || email;
        }
      } catch (e) {
        console.error('Auth profile error', e);
      }
      try {
        const candRes = await api.get('/candidate/profile/');
        if (candRes.data && candRes.data.profile_picture) {
          const p = candRes.data.profile_picture;
          pic = p.startsWith('http') ? p : `http://127.0.0.1:8000${p}`;
        }
      } catch (e) {
        console.error('Candidate profile error', e);
      }
      setUserProfile({ name, email, profilePicture: pic });
    };
    fetchProfile();
  }, []);

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <header className="top-navbar">
      <div className="navbar-container">
        <button className="navbar-brand" onClick={() => (window.location.href = '/')}>
          PrepMaster AI
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
              <img src={userProfile.profilePicture} alt="Profile" className="avatar-img" />
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
              <button className="profile-dropdown-item" onClick={() => (window.location.href = '/candidate-profile')}>
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