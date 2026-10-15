import { useState, useEffect } from 'react'
import { userApi } from '../api/userApi'
import { X, Loader2, AlertCircle } from 'lucide-react'

const AVAILABLE_ROLES = [
  { key: 'ROLE_ADMIN', label: 'Administrator' },
  { key: 'ROLE_DOCTOR', label: 'Doctor' },
  { key: 'ROLE_NURSE', label: 'Nurse' },
  { key: 'ROLE_RECEPTIONIST', label: 'Receptionist' },
  { key: 'ROLE_LABORATORY_STAFF', label: 'Laboratory Staff' },
  { key: 'ROLE_PHARMACIST', label: 'Pharmacist' },
  { key: 'ROLE_ACCOUNTANT', label: 'Accountant' },
]

export default function UserModal({ isOpen, onClose, onUserSaved, userToEdit }) {
  const isEditing = !!userToEdit

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    status: 'ACTIVE',
    roles: ['ROLE_RECEPTIONIST']
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        password: '',
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        phoneNumber: userToEdit.phoneNumber || '',
        status: userToEdit.status || 'ACTIVE',
        roles: userToEdit.roles || ['ROLE_RECEPTIONIST']
      })
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        status: 'ACTIVE',
        roles: ['ROLE_RECEPTIONIST']
      })
    }
    setError('')
  }, [userToEdit, isOpen])

  if (!isOpen) return null

  const handleRoleToggle = (roleKey) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleKey)
      if (exists) {
        if (prev.roles.length === 1) return prev // keep at least one role
        return { ...prev, roles: prev.roles.filter((r) => r !== roleKey) }
      } else {
        return { ...prev, roles: [...prev.roles, roleKey] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        await userApi.updateUser(userToEdit.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          status: formData.status,
          roles: formData.roles
        })
      } else {
        await userApi.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          roles: formData.roles
        })
      }
      onUserSaved()
      onClose()
    } catch (err) {
      const respData = err.response?.data
      let errorMsg = 'Failed to save user.'
      if (respData?.message) {
        if (typeof respData.message === 'object') {
          errorMsg = Object.values(respData.message).join(', ')
        } else {
          errorMsg = respData.message
        }
      } else if (err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3>{isEditing ? 'Edit User Details' : 'Create New System User'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isEditing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. dr_smith"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="smith@careflow.lk"
                  required
                />
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+94 77 123 4567"
              />
            </div>

            {isEditing && (
              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="LOCKED">LOCKED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '0.6rem' }}>Assigned Roles *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--surface-alt)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.key)}
                    onChange={() => handleRoleToggle(role.key)}
                  />
                  <span>{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
