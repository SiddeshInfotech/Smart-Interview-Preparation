import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell, User } from 'lucide-react';
import '../styles/ToastNotification.css';

// Toast Types
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
  WELCOME: 'welcome'
};

// Toast Context
const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = ToastType.INFO, duration = 4000, title = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration, title }]);
    
    // Auto dismiss
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showWelcome = (name) => {
    showToast(
      `Welcome back, ${name}! 👋 We're happy to see you again.`,
      ToastType.WELCOME,
      5000,
      'Welcome!'
    );
  };

  const showLoginSuccess = (name) => {
    showToast(
      `Successfully logged in as ${name}. Let's prepare for your interviews! 🚀`,
      ToastType.SUCCESS,
      4000,
      'Login Successful'
    );
  };

  const showError = (message) => {
    showToast(
      message || 'Something went wrong. Please try again.',
      ToastType.ERROR,
      5000,
      'Error'
    );
  };

  const showSuccess = (message, title = 'Success') => {
    showToast(message, ToastType.SUCCESS, 4000, title);
  };

  const showInfo = (message, title = 'Info') => {
    showToast(message, ToastType.INFO, 4000, title);
  };

  const value = {
    showToast,
    removeToast,
    showWelcome,
    showLoginSuccess,
    showError,
    showSuccess,
    showInfo,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ id, message, type, title, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case ToastType.SUCCESS:
        return <CheckCircle size={22} />;
      case ToastType.ERROR:
        return <AlertCircle size={22} />;
      case ToastType.WARNING:
        return <AlertTriangle size={22} />;
      case ToastType.WELCOME:
        return <User size={22} />;
      default:
        return <Info size={22} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case ToastType.SUCCESS:
        return 'toast-success';
      case ToastType.ERROR:
        return 'toast-error';
      case ToastType.WARNING:
        return 'toast-warning';
      case ToastType.WELCOME:
        return 'toast-welcome';
      default:
        return 'toast-info';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case ToastType.SUCCESS:
        return '#10b981';
      case ToastType.ERROR:
        return '#ef4444';
      case ToastType.WARNING:
        return '#f59e0b';
      case ToastType.WELCOME:
        return '#2563eb';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className={`toast ${getTypeClass()} ${isVisible ? 'slide-in' : 'slide-out'}`}>
      <div className="toast-icon-wrapper" style={{ background: getIconBg() }}>
        {getIcon()}
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
        <div className="toast-progress-bar" style={{ background: getIconBg() }}>
          <div className="toast-progress" style={{ animationDuration: '4s' }}></div>
        </div>
      </div>
      <button className="toast-close" onClick={handleClose}>
        <X size={18} />
      </button>
    </div>
  );
};

export default ToastProvider;