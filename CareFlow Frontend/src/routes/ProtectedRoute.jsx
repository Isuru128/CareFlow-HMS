import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldX, Loader2 } from 'lucide-react'

export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, loading, hasRole } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary)" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div className="card">
          <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            <ShieldX size={48} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            You do not have administrative privileges ({requiredRole}) to access this page.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <Outlet />
}
