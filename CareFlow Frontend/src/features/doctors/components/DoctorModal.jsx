import { useState, useEffect } from 'react'
import { doctorApi } from '../api/doctorApi'
import { X, Loader2, AlertCircle, Stethoscope, Building, Award, DollarSign } from 'lucide-react'

export default function DoctorModal({ isOpen, onClose, onSuccess, doctor = null }) {
  const isEditMode = Boolean(doctor)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialization: '',
    licenseNumber: '',
    departmentId: '',
    qualification: '',
    experienceYears: 0,
    contactNumber: '',
    email: '',
    consultationFee: 2500,
    roomNumber: '',
    bio: '',
    status: 'ACTIVE'
  })

  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadDepartments()
      if (doctor) {
        setFormData({
          firstName: doctor.firstName || '',
          lastName: doctor.lastName || '',
          specialization: doctor.specialization || '',
          licenseNumber: doctor.licenseNumber || '',
          departmentId: doctor.departmentId || '',
          qualification: doctor.qualification || '',
          experienceYears: doctor.experienceYears ?? 0,
          contactNumber: doctor.contactNumber || '',
          email: doctor.email || '',
          consultationFee: doctor.consultationFee ?? 2500,
          roomNumber: doctor.roomNumber || '',
          bio: doctor.bio || '',
          status: doctor.status || 'ACTIVE'
        })
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          specialization: '',
          licenseNumber: '',
          departmentId: '',
          qualification: '',
          experienceYears: 0,
          contactNumber: '',
          email: '',
          consultationFee: 2500,
          roomNumber: '',
          bio: '',
          status: 'ACTIVE'
        })
      }
      setError('')
    }
  }, [isOpen, doctor])

  const loadDepartments = async () => {
    setLoadingDepts(true)
    try {
      const data = await doctorApi.getDepartments(true)
      setDepartments(data || [])
      if (!isEditMode && data && data.length > 0 && !formData.departmentId) {
        setFormData(prev => ({ ...prev, departmentId: data[0].id }))
      }
    } catch (err) {
      // Non critical
    } finally {
      setLoadingDepts(false)
    }
  }

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    if (!formData.specialization.trim()) {
      setError('Specialization is required.')
      return
    }
    if (!formData.licenseNumber.trim()) {
      setError('Medical license number is required.')
      return
    }
    if (!formData.departmentId) {
      setError('Please select a department.')
      return
    }
    if (!formData.qualification.trim()) {
      setError('Qualification is required.')
      return
    }
    if (!formData.contactNumber.trim()) {
      setError('Contact number is required.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
        consultationFee: Number(formData.consultationFee),
        experienceYears: Number(formData.experienceYears) || 0
      }

      if (isEditMode) {
        await doctorApi.updateDoctor(doctor.id, payload)
      } else {
        await doctorApi.createDoctor(payload)
      }

      onSuccess(isEditMode ? 'Doctor details updated successfully!' : 'Doctor registered successfully!')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '780px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {isEditMode ? `Edit Doctor: Dr. ${doctor.firstName} ${doctor.lastName}` : 'Add New Doctor'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {isEditMode ? `ID: ${doctor.doctorNumber}` : 'Enter physician qualifications, license & department'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.25rem' }}>
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
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Basic Info */}
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 700 }}>
              Personal & Identification Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  First Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Kumara"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Last Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Perera"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  License / SLMC No. <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="e.g. SLMC-12345"
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Medical Credentials */}
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 700 }}>
              Clinical Credentials & Department Assignment
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Specialization <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g. Cardiologist, Pediatrician"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Department <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="form-control"
                  required
                  disabled={loadingDepts}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Qualifications <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g. MBBS, MD, FRCP"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  min="0"
                  max="60"
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Consultation Fee (LKR) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  min="0"
                  step="50"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Room / Office No.
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. Room 102"
                  className="form-control"
                />
              </div>
            </div>

            {/* Contact & Status */}
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 700 }}>
              Contact & Availability
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Contact Number <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="e.g. +94771234567"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. doctor@careflow.lk"
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                Professional Biography & Clinical Focus
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary of clinical achievements, sub-specialties, and background..."
                className="form-control"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{isEditMode ? 'Update Doctor' : 'Register Doctor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
