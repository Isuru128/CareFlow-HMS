import { useState, useEffect } from 'react'
import { userApi } from '../../features/users/api/userApi'
import { authApi } from '../../features/auth/api/authApi'
import { useAuth } from '../../context/AuthContext'
import { User, Shield, Lock, Phone, Mail, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function UserProfilePage() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [pwStatus, setPwStatus] = useState({ error: '', success: '', loading: false })

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await userApi.getCurrentUser()
        setProfile(data)
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwStatus({ error: '', success: '', loading: true })

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwStatus({ error: 'New passwords do not match', success: '', loading: false })
      return
    }

    if (passwords.newPassword.length < 6) {
      setPwStatus({ error: 'New password must be at least 6 characters', success: '', loading: false })
      return
    }

    try {
      const data = await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      setPwStatus({
        error: '',
        success: data.message || 'Password changed successfully!',
        loading: false
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password'
      setPwStatus({ error: typeof msg === 'string' ? msg : 'Error changing password', success: '', loading: false })
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto' }} />
      </div>
    )
  }

  const currentUser = profile || authUser

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Account Profile</h1>
        <p style={{ fontSize: '0.875rem' }}>View your profile details and manage account credentials.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              {currentUser?.firstName?.[0] || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>{currentUser?.firstName} {currentUser?.lastName}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{currentUser?.username}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} color="var(--text-light)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{currentUser?.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} color="var(--text-light)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{currentUser?.phoneNumber || 'Not provided'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={18} color="var(--text-light)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Roles</div>
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  {currentUser?.roles?.map((r) => (
                    <span key={r} className="badge badge-role">{r.replace('ROLE_', '')}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={18} color="var(--text-light)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Created</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} color="var(--primary)" /> Change Password
          </h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Update your account password to maintain system security.
          </p>

          {pwStatus.error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{pwStatus.error}</span>
            </div>
          )}

          {pwStatus.success && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>{pwStatus.success}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                className="form-input"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPasswordProfile">New Password</label>
              <input
                id="newPasswordProfile"
                type="password"
                className="form-input"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPasswordProfile">Confirm New Password</label>
              <input
                id="confirmPasswordProfile"
                type="password"
                className="form-input"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={pwStatus.loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {pwStatus.loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
