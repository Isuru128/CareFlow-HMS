import { useState, useEffect } from 'react'
import { doctorApi } from '../api/doctorApi'
import { X, Building2, Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function DepartmentModal({ isOpen, onClose, onUpdated }) {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactNumber: '',
    isActive: true
  })

  useEffect(() => {
    if (isOpen) {
      loadDepartments()
      resetForm()
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const data = await doctorApi.getDepartments(false)
      setDepartments(data || [])
    } catch (err) {
      setError('Failed to load departments.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      contactNumber: '',
      isActive: true
    })
    setIsEditing(false)
    setEditingId(null)
  }

  if (!isOpen) return null

  const handleEdit = (dept) => {
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      contactNumber: dept.contactNumber || '',
      isActive: dept.isActive
    })
    setEditingId(dept.id)
    setIsEditing(true)
    setError('')
  }

  const handleDelete = async (id, doctorCount) => {
    if (doctorCount > 0) {
      alert(`Cannot delete department with ${doctorCount} assigned doctor(s). Please reassign them first.`)
      return
    }
    if (!window.confirm('Are you sure you want to delete this department?')) return

    try {
      await doctorApi.deleteDepartment(id)
      setSuccess('Department deleted successfully.')
      loadDepartments()
      if (onUpdated) onUpdated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete department.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Name and unique code are required.')
      return
    }

    setSubmitting(true)
    try {
      if (isEditing) {
        await doctorApi.updateDepartment(editingId, formData)
        setSuccess('Department updated successfully!')
      } else {
        await doctorApi.createDepartment(formData)
        setSuccess('Department created successfully!')
      }

      resetForm()
      loadDepartments()
      if (onUpdated) onUpdated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save department.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '750px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Hospital Departments
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage medical departments and units for doctor assignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon"
            style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.25rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-light)',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              border: '1px solid var(--success-light)',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            background: 'var(--surface-alt)',
            padding: '1.2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
              {isEditing ? 'Edit Department' : 'Create New Department'}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CARD"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Contact Number
                </label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="e.g. +94112345001"
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Department medical services..."
                className="form-control"
                rows={2}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>{isEditing ? 'Update Department' : 'Add Department'}</span>
              </button>
            </div>
          </form>

          {/* List of Departments */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Existing Departments ({departments.length})
          </h4>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Loading departments...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {departments.map(dept => (
                <div
                  key={dept.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{dept.name}</strong>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: 700
                      }}>
                        {dept.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {dept.description || 'No description provided'} • <strong>{dept.doctorCount || 0} Doctors Assigned</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleEdit(dept)}
                      className="btn btn-icon"
                      title="Edit Department"
                      style={{ border: '1px solid var(--border)', background: 'transparent' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.doctorCount)}
                      className="btn btn-icon"
                      title="Delete Department"
                      style={{ border: '1px solid var(--danger-light)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
