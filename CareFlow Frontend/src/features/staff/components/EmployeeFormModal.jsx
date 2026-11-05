import React, { useState, useEffect } from 'react'
import { staffApi } from '../api/staffApi'
import { X, UserPlus, Save, AlertCircle } from 'lucide-react'

export default function EmployeeFormModal({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit = null,
  departments = []
}) {
  const isEditMode = Boolean(employeeToEdit)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nicOrPassport: '',
    gender: 'FEMALE',
    dateOfBirth: '1994-06-15',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    roleCategory: 'NURSE',
    designation: '',
    departmentId: '',
    employmentType: 'FULL_TIME',
    shiftType: 'MORNING',
    joinDate: new Date().toISOString().split('T')[0],
    basicSalary: '85000',
    qualification: '',
    status: 'ACTIVE',
    annualLeaveQuota: 14,
    casualLeaveQuota: 7,
    sickLeaveQuota: 7,
    notes: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (employeeToEdit) {
        setFormData({
          firstName: employeeToEdit.firstName || '',
          lastName: employeeToEdit.lastName || '',
          nicOrPassport: employeeToEdit.nicOrPassport || '',
          gender: employeeToEdit.gender || 'FEMALE',
          dateOfBirth: employeeToEdit.dateOfBirth || '1994-06-15',
          contactNumber: employeeToEdit.contactNumber || '',
          email: employeeToEdit.email || '',
          address: employeeToEdit.address || '',
          emergencyContactName: employeeToEdit.emergencyContactName || '',
          emergencyContactNumber: employeeToEdit.emergencyContactNumber || '',
          roleCategory: employeeToEdit.roleCategory || 'NURSE',
          designation: employeeToEdit.designation || '',
          departmentId: employeeToEdit.departmentId ? String(employeeToEdit.departmentId) : (departments[0]?.id ? String(departments[0].id) : ''),
          employmentType: employeeToEdit.employmentType || 'FULL_TIME',
          shiftType: employeeToEdit.shiftType || 'MORNING',
          joinDate: employeeToEdit.joinDate || new Date().toISOString().split('T')[0],
          basicSalary: employeeToEdit.basicSalary !== undefined ? String(employeeToEdit.basicSalary) : '85000',
          qualification: employeeToEdit.qualification || '',
          status: employeeToEdit.status || 'ACTIVE',
          annualLeaveQuota: employeeToEdit.annualLeaveQuota ?? 14,
          casualLeaveQuota: employeeToEdit.casualLeaveQuota ?? 7,
          sickLeaveQuota: employeeToEdit.sickLeaveQuota ?? 7,
          notes: employeeToEdit.notes || ''
        })
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          nicOrPassport: '',
          gender: 'FEMALE',
          dateOfBirth: '1994-06-15',
          contactNumber: '',
          email: '',
          address: '',
          emergencyContactName: '',
          emergencyContactNumber: '',
          roleCategory: 'NURSE',
          designation: '',
          departmentId: departments[0]?.id ? String(departments[0].id) : '',
          employmentType: 'FULL_TIME',
          shiftType: 'MORNING',
          joinDate: new Date().toISOString().split('T')[0],
          basicSalary: '85000',
          qualification: '',
          status: 'ACTIVE',
          annualLeaveQuota: 14,
          casualLeaveQuota: 7,
          sickLeaveQuota: 7,
          notes: ''
        })
      }
    }
  }, [isOpen, employeeToEdit, departments])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.departmentId) {
      setError('Please select a hospital department.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
        basicSalary: Number(formData.basicSalary) || 0,
        annualLeaveQuota: Number(formData.annualLeaveQuota) || 14,
        casualLeaveQuota: Number(formData.casualLeaveQuota) || 7,
        sickLeaveQuota: Number(formData.sickLeaveQuota) || 7
      }
      if (isEditMode) {
        await staffApi.updateEmployee(employeeToEdit.id, payload)
      } else {
        await staffApi.registerEmployee(payload)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '820px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {isEditMode ? `Update Employee Profile (${employeeToEdit.employeeNumber})` : 'Register New Hospital Staff Employee'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Personal demographics, clinical/admin role, department placement, shift & leave quotas
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Personal & Contact Details */}
            <div style={{
              padding: '0.95rem 1.1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                1. Personal Demographics & Contact Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-input"
                    required
                    placeholder="e.g., Nadeesha"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-input"
                    required
                    placeholder="e.g., Fernando"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">NIC / Passport No. *</label>
                  <input
                    type="text"
                    name="nicOrPassport"
                    className="form-input"
                    required
                    placeholder="e.g., 199462409182"
                    value={formData.nicOrPassport}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Gender *</label>
                  <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Contact Number *</label>
                  <input
                    type="text"
                    name="contactNumber"
                    className="form-input"
                    required
                    placeholder="+94771234567"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Official Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    required
                    placeholder="name@careflow.lk"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    className="form-input"
                    placeholder="Next of kin name"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Emergency Contact Phone</label>
                  <input
                    type="text"
                    name="emergencyContactNumber"
                    className="form-input"
                    placeholder="+9471..."
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                <label className="form-label">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="Street address, city"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Section 2: Role, Department Assignment & Shift */}
            <div style={{
              padding: '0.95rem 1.1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                2. Clinical / Administrative Role, Department Assignment & Shift
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Staff Role Category *</label>
                  <select name="roleCategory" className="form-select" value={formData.roleCategory} onChange={handleChange}>
                    <option value="NURSE">Nursing Staff</option>
                    <option value="LABORATORY_STAFF">Laboratory Staff</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="DOCTOR">Medical Officer / Doctor</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="SUPPORT_STAFF">Support Staff</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Designation / Job Title *</label>
                  <input
                    type="text"
                    name="designation"
                    className="form-input"
                    required
                    placeholder="e.g., Senior Staff Nurse (ICU)"
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Assigned Department *</label>
                  <select
                    name="departmentId"
                    className="form-select"
                    required
                    value={formData.departmentId}
                    onChange={handleChange}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Employment Type</label>
                  <select name="employmentType" className="form-select" value={formData.employmentType} onChange={handleChange}>
                    <option value="FULL_TIME">Full-Time Permanent</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract Basis</option>
                    <option value="VISITING">Visiting Specialist</option>
                    <option value="INTERN">Intern / Trainee</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Primary Duty Shift</label>
                  <select name="shiftType" className="form-select" value={formData.shiftType} onChange={handleChange}>
                    <option value="MORNING">Morning Shift (07:30 - 15:30)</option>
                    <option value="REGULAR_DAY">Regular Day (08:00 - 17:00)</option>
                    <option value="EVENING">Evening Shift (14:00 - 22:00)</option>
                    <option value="NIGHT">Night Shift (21:30 - 07:30)</option>
                    <option value="ROTATIONAL">Rotational Roster</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Employment Status</label>
                  <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Date of Joining</label>
                  <input
                    type="date"
                    name="joinDate"
                    className="form-input"
                    value={formData.joinDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Basic Monthly Salary (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="basicSalary"
                    className="form-input"
                    value={formData.basicSalary}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Qualifications & Licenses</label>
                  <input
                    type="text"
                    name="qualification"
                    className="form-input"
                    placeholder="e.g., BSc Nursing, SLNC Reg"
                    value={formData.qualification}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Annual Leave Entitlements & Notes */}
            <div style={{
              padding: '0.95rem 1.1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                3. Annual Leave Entitlements & HR Notes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Annual Leave Quota (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    name="annualLeaveQuota"
                    className="form-input"
                    value={formData.annualLeaveQuota}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Casual Leave Quota (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    name="casualLeaveQuota"
                    className="form-input"
                    value={formData.casualLeaveQuota}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Medical/Sick Leave Quota</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    name="sickLeaveQuota"
                    className="form-input"
                    value={formData.sickLeaveQuota}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                <label className="form-label">Additional HR / Clinical Responsibility Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="form-input"
                  placeholder="Ward responsibilities, certifications, or special shift notes..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} />
              <span>{submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Register Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

