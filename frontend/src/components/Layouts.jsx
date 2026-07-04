import React from 'react'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from './Footer.jsx'

export function PublicLayout({ children }) {
  return (
    <div className="page-with-navbar">
      <Navbar />
      <div className="page-with-navbar__body">{children}</div>
      <Footer />
    </div>
  )
}

export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <div className="app-shell__content">{children}</div>
      </div>
    </div>
  )
}

export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <Navbar />
      {children}
    </div>
  )
}