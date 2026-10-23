import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../features/auth/api/authApi'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ error: '', success: '', token: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ error: '', success: '', token: '' })
    setLoading(true)

    try {
      const data = await authApi.forgotPassword(email)
      setStatus({
        error: '',
        success: data.message || 'Password reset instructions have been generated.',
        token: data.message?.includes(':') ? data.message.split(':')[1]?.trim() : ''
      })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to request password reset'
      setStatus({ error: typeof msg === 'string' ? msg : 'Error processing request', success: '', token: '' })
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
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset Password</h1>
          <p style={{ fontSize: '0.875rem' }}>
            Enter your registered hospital email address to receive password recovery instructions.
          </p>
        </div>

        {status.error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{status.error}</span>
          </div>
        )}

        {status.success && (
          <div className="alert alert-success" style={{ flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{status.success}</span>
            </div>
            {status.token && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', background: '#ffffff', padding: '0.5rem', borderRadius: '4px', border: '1px dashed #10b981', width: '100%', wordBreak: 'break-all' }}>
                <strong>Reset Token:</strong> {status.token}
                <div style={{ marginTop: '0.5rem' }}>
                  <Link to={`/reset-password?token=${status.token}`} className="btn btn-sm btn-primary">
                    Proceed to Reset Password
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Hospital Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="e.g. admin@careflow.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Generate Reset Token'}
          </button>
        </form>
      </div>
    </div>
  )
}
