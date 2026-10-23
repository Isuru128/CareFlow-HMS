import { useState, useEffect } from 'react'
import { patientApi } from '../api/patientApi'
import { X, Loader2, AlertCircle, User, Phone, ShieldAlert, HeartPulse } from 'lucide-react'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' }
]
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DECEASED', label: 'Deceased' }
]

export default function PatientModal({ isOpen, onClose, onPatientSaved, patientToEdit }) {
  const isEditing = !!patientToEdit

  const [formData, setFormData] = useState({
    patientNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    contactNumber: '',
    email: '',
    nicOrPassport: '',
    address: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',
    allergies: '',
    status: 'ACTIVE'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        patientNumber: patientToEdit.patientNumber || '',
        firstName: patientToEdit.firstName || '',
        lastName: patientToEdit.lastName || '',
        dateOfBirth: patientToEdit.dateOfBirth || '',
        gender: patientToEdit.gender || 'MALE',
        bloodGroup: patientToEdit.bloodGroup || '',
        contactNumber: patientToEdit.contactNumber || '',
        email: patientToEdit.email || '',
        nicOrPassport: patientToEdit.nicOrPassport || '',
        address: patientToEdit.address || '',
        emergencyContactName: patientToEdit.emergencyContactName || '',
        emergencyContactNumber: patientToEdit.emergencyContactNumber || '',
        emergencyContactRelation: patientToEdit.emergencyContactRelation || '',
        allergies: patientToEdit.allergies || '',
        status: patientToEdit.status || 'ACTIVE'
      })
    } else {
      setFormData({
        patientNumber: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE',
        bloodGroup: '',
        contactNumber: '',
        email: '',
        nicOrPassport: '',
        address: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        emergencyContactRelation: '',
        allergies: '',
        status: 'ACTIVE'
      })
    }
    setError('')
  }, [patientToEdit, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side quick checks
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    if (!formData.dateOfBirth) {
      setError('Date of birth is required.')
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
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim() || null,
        nicOrPassport: formData.nicOrPassport.trim() || null,
        bloodGroup: formData.bloodGroup || null,
        patientNumber: (!isEditing && formData.patientNumber.trim()) ? formData.patientNumber.trim() : null
      }

      let savedPatient
      if (isEditing) {
        savedPatient = await patientApi.updatePatient(patientToEdit.id, payload)
      } else {
        savedPatient = await patientApi.createPatient(payload)
      }

      onPatientSaved(savedPatient)
      onClose()
    } catch (err) {
      const respData = err.response?.data
      if (respData?.validationErrors) {
        const errorList = Object.values(respData.validationErrors).join(', ')
        setError(`Validation error: ${errorList}`)
      } else {
        setError(respData?.message || err.message || 'Failed to save patient. Please check inputs.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-container-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)'
            }}>
              <HeartPulse size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {isEditing ? `Edit Patient (${patientToEdit.patientNumber})` : 'Register New Patient'}
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {isEditing ? 'Update patient baseline, contact and demographic data.' : 'Record demographic and clinical baseline information.'}
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Demographics */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <User size={15} /> Personal & Demographics
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {!isEditing && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                      Patient Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional - leave empty to auto-generate)</span>
                    </label>
                    <input
                      type="text"
                      name="patientNumber"
                      className="form-input"
                      placeholder="e.g. PAT-10025 (auto-generated if blank)"
                      value={formData.patientNumber}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="form-input"
                    placeholder="e.g. John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="form-input"
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    name="bloodGroup"
                    className="form-select"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Unknown / Not Tested</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">NIC / Passport Number</label>
                  <input
                    type="text"
                    name="nicOrPassport"
                    className="form-input"
                    placeholder="e.g. 199012345678"
                    value={formData.nicOrPassport}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Phone size={15} /> Contact Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Contact / Mobile Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    required
                    className="form-input"
                    placeholder="+94 77 123 4567"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Residential Address</label>
                  <textarea
                    name="address"
                    className="form-textarea"
                    rows={2}
                    placeholder="Full street address, city, postal code"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <ShieldAlert size={15} /> Emergency Contact
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    className="form-input"
                    placeholder="e.g. Jane Doe"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Phone Number</label>
                  <input
                    type="tel"
                    name="emergencyContactNumber"
                    className="form-input"
                    placeholder="+94 77 987 6543"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Relationship to Patient</label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    className="form-input"
                    placeholder="e.g. Spouse, Parent, Sibling"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Clinical Baseline & Status */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                Clinical Baseline & Status
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Known Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    className="form-input"
                    placeholder="e.g. Penicillin, Peanuts, Sulfa drugs (leave blank if none)"
                    value={formData.allergies}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Patient Status</label>
                  <select
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
