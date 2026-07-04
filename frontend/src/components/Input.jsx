import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ label, type = 'text', hint, error, id, className = '', ...rest }) {
  const [show, setShow] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="field">
      {label && <label className="field__label" htmlFor={inputId}>{label}</label>}
      <div className="field__control">
        <input id={inputId} type={resolvedType} className={`input ${className}`} {...rest} />
        {isPassword && (
          <button
            type="button"
            className="field__icon-btn"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow((s) => !s)}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  )
}