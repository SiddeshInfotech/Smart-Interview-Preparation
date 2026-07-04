import React from 'react'

export function Card({ children, variant = 'default', className = '', ...rest }) {
  const variantClass =
    variant === 'flat' ? 'card--flat' :
    variant === 'elevated' ? 'card--elevated' :
    variant === 'dark' ? 'card--dark' : ''

  return (
    <div className={`card ${variantClass} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, trend, icon }) {
  return (
    <Card className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-card__label">{label}</span>
        {icon}
      </div>
      <span className="stat-card__value">{value}</span>
      {trend && <span style={{ fontSize: 12.5, color: 'var(--color-success)' }}>{trend}</span>}
    </Card>
  )
}

export function ProgressBar({ percent = 0 }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  )
}

export function Badge({ children, color = 'blue' }) {
  return <span className={`badge badge--${color}`}>{children}</span>
}

export default Card