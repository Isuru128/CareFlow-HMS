import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import { patientApi } from '../../patients/api/patientApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react'

export default function TreatmentModal({ isOpen, onClose, onSaved, treatment = null, defaultPatientId }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [treatmentName, setTreatmentName] = useState('')
  const [category, setCategory] = useState('MEDICATION_THERAPY')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('IN_PROGRESS')
  const [outcome, setOutcome] = useState('IMPROVED')
  const [procedureNotes, setProcedureNotes] = useState('')
  const [complications, setComplications] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadMetadata()
      if (treatment) {
        setTreatmentName(treatment.treatmentName || '')
        setCategory(treatment.category || 'MEDICATION_THERAPY')
        setStartDate(treatment.startDate || new Date().toISOString().split('T')[0])
        setEndDate(treatment.endDate || '')
        setStatus(treatment.status || 'IN_PROGRESS')
        setOutcome(treatment.outcome || 'IMPROVED')
        setProcedureNotes(treatment.procedureNotes || '')
        setComplications(treatment.complications || '')
        setPatientId(treatment.patientId || '')
        setDoctorId(treatment.doctorId || '')
      } else {
        setTreatmentName('')
        setCategory('MEDICATION_THERAPY')
        setStartDate(new Date().toISOString().split('T')[0])
        setEndDate('')
        setStatus('IN_PROGRESS')
        setOutcome('IMPROVED')
        setProcedureNotes('')
        setComplications('')
        setPatientId(defaultPatientId || '')
      }
    }
  }, [isOpen, treatment, defaultPatientId])

  const loadMetadata = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])
      setPatients(patRes?.content || [])
      setDoctors(docRes || [])
      if (!treatment && docRes && docRes.length > 0 && !doctorId) {
        setDoctorId(docRes[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!treatmentName.trim()) {
      setError('Treatment procedure/therapy name is required.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (treatment) {
        await emrApi.updateTreatment(treatment.id, {
          doctorId: doctorId ? Number(doctorId) : null,
          treatmentName: treatmentName.trim(),
          category,
          startDate,
          endDate: endDate || null,
          status,
          outcome,
          procedureNotes: procedureNotes.trim() || null,
          complications: complications.trim() || null
        })
      } else {
        if (!patientId) {
          setError('Please select a patient.')
          setSubmitting(false)
          return
        }

        await emrApi.addTreatment({
          patientId: Number(patientId),
          doctorId: doctorId ? Number(doctorId) : null,
          treatmentName: treatmentName.trim(),
          category,
          startDate,
          endDate: endDate || null,
          status,
          outcome,
          procedureNotes: procedureNotes.trim() || null,
          complications: complications.trim() || null
        })
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save treatment record.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-container" style={{ maxWidth: '640px', width: '95%', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
              {treatment ? 'Edit Treatment Record' : 'Record Treatment / Procedure'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!treatment && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Patient <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patientNumber} - {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Performing Clinician
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="">-- Optional Clinician --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Treatment Name / Procedure <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wound Debridement & Sterile Dressing"
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="MEDICATION_THERAPY">Medication Therapy</option>
                <option value="SURGICAL_PROCEDURE">Surgical Procedure</option>
                <option value="PHYSIOTHERAPY">Physiotherapy</option>
                <option value="WOUND_CARE">Wound Care</option>
                <option value="DIALYSIS">Dialysis</option>
                <option value="CHEMOTHERAPY">Chemotherapy</option>
                <option value="REHABILITATION">Rehabilitation</option>
                <option value="OTHER">Other Clinical Therapy</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PLANNED">Planned</option>
                <option value="COMPLETED">Completed</option>
                <option value="DISCONTINUED">Discontinued</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Clinical Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="IMPROVED">Improved</option>
                <option value="RECOVERED">Recovered</option>
                <option value="UNCHANGED">Unchanged</option>
                <option value="DETERIORATED">Deteriorated</option>
                <option value="NOT_EVALUATED">Pending Evaluation</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Start Date <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Procedure Details & Clinical Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Procedure carried out under local anesthesia with good tolerance..."
              value={procedureNotes}
              onChange={(e) => setProcedureNotes(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Complications / Adverse Reactions (if any)
            </label>
            <input
              type="text"
              placeholder="e.g. None reported or minor localized erythema"
              value={complications}
              onChange={(e) => setComplications(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {treatment ? 'Save Changes' : 'Record Treatment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
