import React, { useState, useEffect } from 'react'
import { staffApi } from '../api/staffApi'
import { X, CalendarOff, CheckCircle2, AlertCircle } from 'lucide-react'

export default function LeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  preselectedEmployee = null
}) {
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'ANNUAL',
    startDate: today,
    endDate: today,
    reason: '',
    handoverNotes: '',
    emergencyContact: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      const emp = preselectedEmployee || employees[0]
      setFormData({
        employeeId: emp ? String(emp.id) : '',
        leaveType: 'ANNUAL',
        startDate: today,
        endDate: today,
        reason: '',
        handoverNotes: '',
        emergencyContact: emp?.contactNumber || ''
      })
    }
  }, [isOpen, preselectedEmployee, employees, today])

  if (!isOpen) return null

  const selectedEmp = employees.find(x => String(x.id) === String(formData.employeeId))

  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const s = new Date(formData.startDate)
    const e = new Date(formData.endDate)
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }

  const totalDays = calcDays()

  const handleEmployeeChange = (e) => {
    const empId = e.target.value
    const emp = employees.find(x => String(x.id) === empId)
    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      emergencyContact: emp?.contactNumber || ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employeeId) {
      setError('Please select a staff member.')
      return
    }
    if (totalDays <= 0) {
      setError('Leave end date must be on or after the start date.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await staffApi.createLeaveRequest({
        employeeId: Number(formData.employeeId),
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        handoverNotes: formData.handoverNotes,
        emergencyContact: formData.emergencyContact
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request.')
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
              backgroundColor: '#ede9fe',
              color: '#6d28d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarOff size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Submit Staff Leave Application
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Request annual, casual, medical, or study leave with duty handover details
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
              <label className="form-label">Staff Employee *</label>
              <select
                className="form-select"
                required
                value={formData.employeeId}
                onChange={handleEmployeeChange}
              >
                <option value="">-- Select Staff Member --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeNumber} — {emp.fullName} ({emp.designation} • {emp.departmentName})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Leave Quota Balance Banner */}
            {selectedEmp && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.6rem',
                padding: '0.7rem 0.85rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '0.76rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Annual Leave</div>
                  <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>
                    {Math.max(0, (selectedEmp.annualLeaveQuota || 14) - (selectedEmp.annualLeaveUsed || 0))} / {selectedEmp.annualLeaveQuota || 14} Left
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Casual Leave</div>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                    {Math.max(0, (selectedEmp.casualLeaveQuota || 7) - (selectedEmp.casualLeaveUsed || 0))} / {selectedEmp.casualLeaveQuota || 7} Left
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sick / Medical</div>
                  <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem' }}>
                    {Math.max(0, (selectedEmp.sickLeaveQuota || 7) - (selectedEmp.sickLeaveUsed || 0))} / {selectedEmp.sickLeaveQuota || 7} Left
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Leave Category *</label>
                <select
                  className="form-select"
                  value={formData.leaveType}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="STUDY">Study / CPD Workshop Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="UNPAID">Unpaid / No-Pay Leave</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Emergency Contact Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+9477..."
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.85rem', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">End Date (Inclusive) *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div style={{
                padding: '0.52rem 0.9rem',
                borderRadius: '8px',
                backgroundColor: totalDays > 0 ? '#e0f2fe' : '#fee2e2',
                color: totalDays > 0 ? '#0369a1' : '#b91c1c',
                fontWeight: 800,
                fontSize: '0.84rem',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                {totalDays} Day{totalDays === 1 ? '' : 's'}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Reason for Leave *</label>
              <textarea
                rows={2}
                className="form-input"
                required
                placeholder="Provide reason for leave request..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Clinical / Ward Duty Handover Notes</label>
              <textarea
                rows={2}
                className="form-input"
                placeholder="Specify covering staff member or shift handover instructions..."
                value={formData.handoverNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverNotes: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Leave Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

