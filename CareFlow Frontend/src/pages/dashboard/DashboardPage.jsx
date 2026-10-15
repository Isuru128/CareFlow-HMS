import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { Users, Shield, HeartPulse, UserCheck, Activity, KeyRound } from 'lucide-react'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Welcome back, {user?.firstName} {user?.lastName}!
        </h1>
        <p style={{ fontSize: '0.9rem' }}>
          Logged in with role: <strong>{user?.roles?.map(r => r.replace('ROLE_', '')).join(', ')}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {isAdmin && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                marginBottom: '1rem'
              }}>
                <Users size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>User Management</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Create accounts, assign doctor/nurse/staff roles, lock or activate user credentials.
              </p>
            </div>
            <Link to="/users" className="btn btn-primary">
              Manage Users
            </Link>
          </div>
        )}

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ecfdf5',
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              <UserCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Account Profile</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              View your contact information, credentials, and update your account password.
            </p>
          </div>
          <Link to="/profile" className="btn btn-secondary">
            View Profile
          </Link>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              marginBottom: '1rem'
            }}>
              <Shield size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Role-Based Access</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Access control is enforced via Spring Security JWT tokens verified on every request.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {user?.roles?.map(r => (
              <span key={r} className="badge badge-role">{r.replace('ROLE_', '')}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
