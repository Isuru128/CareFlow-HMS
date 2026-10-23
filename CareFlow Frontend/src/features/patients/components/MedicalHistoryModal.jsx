import { useState, useEffect } from 'react'
import { patientApi } from '../api/patientApi'
import { X, Loader2, AlertCircle, FileText, Stethoscope } from 'lucide-react'

export default function MedicalHistoryModal({
  isOpen,
  onClose,
  patientId,
  historyToEdit,
  onHistorySaved
}) {
  const isEditing = !!historyToEdit

  const [formData, setFormData] = useState({
    conditionOrDiagnosis: '',
    diagnosisDate: new Date().toISOString().split('T')[0],
    treatment: '',
    surgeries: '',
    medications: '',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (historyToEdit) {
      setFormData({
        conditionOrDiagnosis: historyToEdit.conditionOrDiagnosis || '',
        diagnosisDate: historyToEdit.diagnosisDate || '',
        treatment: historyToEdit.treatment || '',
        surgeries: historyToEdit.surgeries || '',
        medications: historyToEdit.medications || '',
        notes: historyToEdit.notes || ''
      })
    } else {
      setFormData({
        conditionOrDiagnosis: '',
        diagnosisDate: new Date().toISOString().split('T')[0],
        treatment: '',
        surgeries: '',
        medications: '',
        notes: ''
      })
    }
    setError('')
  }, [historyToEdit, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.conditionOrDiagnosis.trim()) {
      setError('Diagnosis or medical condition is required.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        conditionOrDiagnosis: formData.conditionOrDiagnosis.trim(),
        diagnosisDate: formData.diagnosisDate || null,
        treatment: formData.treatment.trim() || null,
        surgeries: formData.surgeries.trim() || null,
        medications: formData.medications.trim() || null,
        notes: formData.notes.trim() || null
      }

      let savedRecord
      if (isEditing) {
        savedRecord = await patientApi.updateMedicalHistory(patientId, historyToEdit.id, payload)
      } else {
        savedRecord = await patientApi.addMedicalHistory(patientId, payload)
      }

      onHistorySaved(savedRecord)
      onClose()
    } catch (err) {
      const respData = err.response?.data
      if (respData?.validationErrors) {
        const errorList = Object.values(respData.validationErrors).join(', ')
        setError(`Validation error: ${errorList}`)
      } else {
        setError(respData?.message || err.message || 'Failed to save medical history record.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)'
            }}>
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {isEditing ? 'Edit Medical Record' : 'Add Medical Diagnosis / Record'}
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Record clinical evaluation, diagnosis date, and treatment plan.
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Condition / Primary Diagnosis *</label>
              <input
                type="text"
                name="conditionOrDiagnosis"
                required
                className="form-input"
                placeholder="e.g. Type 2 Diabetes Mellitus, Essential Hypertension"
                value={formData.conditionOrDiagnosis}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Diagnosis Date</label>
              <input
                type="date"
                name="diagnosisDate"
                max={new Date().toISOString().split('T')[0]}
                className="form-input"
                value={formData.diagnosisDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prescribed Medications</label>
              <input
                type="text"
                name="medications"
                className="form-input"
                placeholder="e.g. Metformin 500mg BD, Atorvastatin 20mg nocte"
                value={formData.medications}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Treatment Plan / Therapy</label>
              <textarea
                name="treatment"
                className="form-textarea"
                rows={2}
                placeholder="e.g. Glycemic control, lifestyle modifications, regular monitoring"
                value={formData.treatment}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Surgeries / Procedures (if applicable)</label>
              <input
                type="text"
                name="surgeries"
                className="form-input"
                placeholder="e.g. Appendectomy (2018), Coronary Angioplasty (2021)"
                value={formData.surgeries}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Notes & Observations</label>
              <textarea
                name="notes"
                className="form-textarea"
                rows={3}
                placeholder="Additional notes for medical staff..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Footer */}
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
              {isEditing ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
