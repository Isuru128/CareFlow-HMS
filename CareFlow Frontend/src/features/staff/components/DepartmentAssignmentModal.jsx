import React, { useState, useEffect } from 'react'
import { staffApi } from '../api/staffApi'
import { X, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function DepartmentAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  departments = [],
  preselectedEmployee = null
}) {
  const [formData, setFormData] = useState({
    employeeId: '',
    toDepartmentId: '',
    newDesignation: '',
    newShift: 'MORNING',
    assignmentType: 'TRANSFER',
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      const emp = preselectedEmployee || employees[0]
      setFormData({
        employeeId: emp ? String(emp.id) : '',
        toDepartmentId: emp?.departmentId ? String(emp.departmentId) : (departments[0]?.id ? String(departments[0].id) : ''),
        newDesignation: emp?.designation || '',
        newShift: emp?.shiftType || 'MORNING',
        assignmentType: 'TRANSFER',
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: ''
      })
    }
  }, [isOpen, preselectedEmployee, employees, departments])

  if (!isOpen) return null

  const selectedEmp = employees.find(x => String(x.id) === String(formData.employeeId))

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value
    const emp = employees.find(x => String(x.id) === empId)
    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      toDepartmentId: emp?.departmentId ? String(emp.departmentId) : prev.toDepartmentId,
      newDesignation: emp?.designation || '',
      newShift: emp?.shiftType || 'MORNING'
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employeeId || !formData.toDepartmentId) {
      setError('Please select both an employee and target department.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await staffApi.assignDepartment({
        employeeId: Number(formData.employeeId),
        toDepartmentId: Number(formData.toDepartmentId),
        newDesignation: formData.newDesignation,
        newShift: formData.newShift,
        assignmentType: formData.assignmentType,
        effectiveDate: formData.effectiveDate,
        reason: formData.reason
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process department assignment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Department Assignment, Transfer & Promotion
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Reassign clinical/administrative department, job title, or primary duty shift
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select Staff Employee *</label>
              <select
                className="form-select"
                required
                value={formData.employeeId}
                onChange={handleEmployeeSelect}
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeNumber} — {emp.fullName} (Current: {emp.departmentName})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmp && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Current Department: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedEmp.departmentName} ({selectedEmp.departmentCode})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Current Title: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedEmp.designation}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Assignment Action Type *</label>
                <select
                  className="form-select"
                  value={formData.assignmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value }))}
                >
                  <option value="TRANSFER">Inter-Departmental Transfer</option>
                  <option value="PROMOTION">Role Promotion & Assignment</option>
                  <option value="TEMPORARY_ROTATION">Temporary Ward Rotation</option>
                  <option value="REASSIGNMENT">Shift / Designation Reassignment</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Effective Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target Department *</label>
              <select
                className="form-select"
                required
                value={formData.toDepartmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, toDepartmentId: e.target.value }))}
              >
                <option value="">-- Select Target Department --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">New / Updated Designation *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Senior Nursing Sister"
                  value={formData.newDesignation}
                  onChange={(e) => setFormData(prev => ({ ...prev, newDesignation: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">New Shift Assignment *</label>
                <select
                  className="form-select"
                  value={formData.newShift}
                  onChange={(e) => setFormData(prev => ({ ...prev, newShift: e.target.value }))}
                >
                  <option value="MORNING">Morning (07:30 - 15:30)</option>
                  <option value="REGULAR_DAY">Regular Day (08:00 - 17:00)</option>
                  <option value="EVENING">Evening (14:00 - 22:00)</option>
                  <option value="NIGHT">Night (21:30 - 07:30)</option>
                  <option value="ROTATIONAL">Rotational</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Reason / Authorization Remarks *</label>
              <textarea
                rows={2}
                className="form-input"
                required
                placeholder="Reason for transfer, rotation, or promotion..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Assigning...' : 'Confirm Department Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

