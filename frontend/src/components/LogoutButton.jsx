import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { logout } from '../services/auth.js'

export default function LogoutButton() {
  const navigate = useNavigate()

  return (
    <button className="btn btn--outline btn--sm" onClick={() => logout(navigate)}>
      <LogOut size={15} /> Log Out
    </button>
  )
}