import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../../features/auth/api/authApi'
import { Lock, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const queryToken = searchParams.get('token')
    if (queryToken) {
      setToken(queryToken)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const data = await authApi.resetPassword({ token, newPassword })
      setSuccess(data.message || 'Password has been reset successfully!')
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password'
      setError(typeof msg === 'string' ? msg : 'Invalid or expired reset token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 50%, #0284c7 100%)'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} /> Back to login
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Set New Password</h1>
          <p style={{ fontSize: '0.875rem' }}>
            Enter your reset token and your new account password.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{success} Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="token">Reset Token</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} />
              <input
                id="token"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Paste reset token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} />
              <input
                id="newPassword"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
