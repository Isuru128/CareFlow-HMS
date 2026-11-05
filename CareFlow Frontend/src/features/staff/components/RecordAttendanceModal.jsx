import React, { useState, useEffect } from 'react'
import { staffApi } from '../api/staffApi'
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function RecordAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  preselectedEmployee = null,
  existingAttendance = null
}) {
  const [formData, setFormData] = useState({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    checkInTime: '08:00',
    checkOutTime: '17:00',
    shiftType: 'REGULAR_DAY',
    status: 'PRESENT',
    remarks: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (existingAttendance) {
        setFormData({
          employeeId: String(existingAttendance.employeeId),
          attendanceDate: existingAttendance.attendanceDate || new Date().toISOString().split('T')[0],
          checkInTime: existingAttendance.checkInTime ? existingAttendance.checkInTime.slice(0, 5) : '08:00',
          checkOutTime: existingAttendance.checkOutTime ? existingAttendance.checkOutTime.slice(0, 5) : '',
          shiftType: existingAttendance.shiftType || 'REGULAR_DAY',
          status: existingAttendance.status || 'PRESENT',
          remarks: existingAttendance.remarks || ''
        })
      } else if (preselectedEmployee) {
        setFormData({
          employeeId: String(preselectedEmployee.id),
          attendanceDate: new Date().toISOString().split('T')[0],
          checkInTime: preselectedEmployee.todayCheckInTime ? preselectedEmployee.todayCheckInTime.slice(0, 5) : '08:00',
          checkOutTime: preselectedEmployee.todayCheckOutTime ? preselectedEmployee.todayCheckOutTime.slice(0, 5) : '17:00',
          shiftType: preselectedEmployee.shiftType || 'REGULAR_DAY',
          status: preselectedEmployee.todayAttendanceStatus || 'PRESENT',
          remarks: ''
        })
      } else {
        const firstEmp = employees[0]
        setFormData({
          employeeId: firstEmp ? String(firstEmp.id) : '',
          attendanceDate: new Date().toISOString().split('T')[0],
          checkInTime: '08:00',
          checkOutTime: '17:00',
          shiftType: firstEmp?.shiftType || 'REGULAR_DAY',
          status: 'PRESENT',
          remarks: ''
        })
      }
    }
  }, [isOpen, existingAttendance, preselectedEmployee, employees])

  if (!isOpen) return null

  const handleEmployeeChange = (e) => {
    const empId = e.target.value
    const emp = employees.find(x => String(x.id) === empId)
    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      shiftType: emp?.shiftType || prev.shiftType
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employeeId) {
      setError('Please select a staff member.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const hideTimes = formData.status === 'ABSENT' || formData.status === 'ON_LEAVE' || formData.status === 'HOLIDAY'
      await staffApi.recordOrUpdateAttendance({
        employeeId: Number(formData.employeeId),
        attendanceDate: formData.attendanceDate,
        checkInTime: hideTimes || !formData.checkInTime ? null : `${formData.checkInTime}:00`,
        checkOutTime: hideTimes || !formData.checkOutTime ? null : `${formData.checkOutTime}:00`,
        shiftType: formData.shiftType,
        status: formData.status,
        remarks: formData.remarks
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record attendance.')
    } finally {
      setSubmitting(false)
    }
  }

  const isNonWorkingStatus = formData.status === 'ABSENT' || formData.status === 'ON_LEAVE' || formData.status === 'HOLIDAY'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '560px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {existingAttendance ? 'Update Daily Attendance Record' : 'Mark Staff Attendance & Shift Hours'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Record check-in, check-out, shift roster, and automatically compute overtime
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
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeNumber} — {emp.fullName} ({emp.designation} • {emp.departmentName})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Attendance Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.attendanceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendanceDate: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Duty Shift *</label>
                <select
                  className="form-select"
                  value={formData.shiftType}
                  onChange={(e) => setFormData(prev => ({ ...prev, shiftType: e.target.value }))}
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
              <label className="form-label">Attendance Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="PRESENT">Present (On Duty)</option>
                <option value="LATE">Late Arrival</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Approved Leave</option>
                <option value="HOLIDAY">Off Duty / Public Holiday</option>
              </select>
            </div>

            {!isNonWorkingStatus && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Check-In Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Check-Out Time (Optional if still on duty)</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Shift Handover / Attendance Remarks</label>
              <textarea
                rows={2}
                className="form-input"
                placeholder="e.g., Completed morning ward rounds; 1 hour overtime for emergency admission..."
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Recording...' : 'Save Attendance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

