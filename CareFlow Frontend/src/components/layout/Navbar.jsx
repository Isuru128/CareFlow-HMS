import { useAuth } from '../../context/AuthContext'
import { LogOut, User as UserIcon, Shield } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Hospital Management Portal
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-alt)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
          <Shield size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
            {user?.roles?.map(r => r.replace('ROLE_', '')).join(', ') || 'USER'}
          </span>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign out of system"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
