import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogOut, Shield, AlertTriangle, X, Loader2 } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogoutModal && !isLoggingOut) {
        setShowLogoutModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLogoutModal, isLoggingOut])

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Hospital Management Portal
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--surface-alt)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            <Shield size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
              {user?.roles?.map((r) => r.replace('ROLE_', '')).join(', ') || 'USER'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="btn btn-secondary btn-sm"
            title="Sign out of system"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div
          className="modal-overlay"
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div
            className="modal-container"
            style={{ maxWidth: '430px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid var(--danger-light)',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 id="logout-modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Confirm Logout
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="btn btn-icon"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.35rem 1.5rem' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.55, marginBottom: '0.85rem' }}>
                Are you sure you want to sign out of your <strong>CareFlow HMS</strong> session?
              </p>

              {user && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}
                  >
                    {user.firstName?.[0] || user.username?.[0] || 'U'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user.email || `@${user.username}`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="btn btn-danger"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={15} />
                    <span>Yes, Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
