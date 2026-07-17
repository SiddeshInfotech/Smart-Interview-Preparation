import React, { useState, useEffect } from 'react';

const WelcomePopup = ({ userName, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto close after 8 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeIn 0.5s ease-out',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px 40px 40px',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        animation: 'scaleIn 0.5s ease-out',
        textAlign: 'center'
      }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          ✕
        </button>

        {/* Icon with gradient */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 10px 40px rgba(37, 99, 235, 0.3)',
          animation: 'bounceIn 0.8s ease-out',
          fontSize: '40px'
        }}>
          🎉
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 8px',
          animation: 'slideUp 0.6s ease-out'
        }}>
          Welcome back! 👋
        </h2>

        {/* User Name */}
        <p style={{
          fontSize: '20px',
          color: '#2563eb',
          fontWeight: '600',
          margin: '0 0 16px',
          animation: 'slideUp 0.7s ease-out'
        }}>
          {userName || 'Guest'}
        </p>

        {/* Message */}
        <p style={{
          fontSize: '15px',
          color: '#6b7280',
          lineHeight: '1.6',
          margin: '0 0 24px',
          animation: 'slideUp 0.8s ease-out'
        }}>
          Great to see you again! Your interview preparation is on track. 
          Ready to ace your next interview? 🚀
        </p>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '28px',
          animation: 'slideUp 0.9s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f8faff, #eff6ff)',
            padding: '14px 12px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🚀</div>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>92%</p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Readiness</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f8faff, #eff6ff)',
            padding: '14px 12px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎯</div>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>8</p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Interviews</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f8faff, #eff6ff)',
            padding: '14px 12px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>⚡</div>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>4</p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Skills</p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
            animation: 'slideUp 1s ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
          }}
        >
          Continue to Dashboard →
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomePopup;