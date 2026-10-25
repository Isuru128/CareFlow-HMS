import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import { patientApi } from '../../patients/api/patientApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import { X, Activity, Loader2, AlertCircle } from 'lucide-react'

export default function DiagnosisModal({ isOpen, onClose, onSaved, diagnosis = null, defaultPatientId }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [diagnosisName, setDiagnosisName] = useState('')
  const [icd10Code, setIcd10Code] = useState('')
  const [diagnosisType, setDiagnosisType] = useState('PRIMARY')
  const [status, setStatus] = useState('ACTIVE')
  const [severity, setSeverity] = useState('MODERATE')
  const [diagnosedDate, setDiagnosedDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadMetadata()
      if (diagnosis) {
        setDiagnosisName(diagnosis.diagnosisName || '')
        setIcd10Code(diagnosis.icd10Code || '')
        setDiagnosisType(diagnosis.diagnosisType || 'PRIMARY')
        setStatus(diagnosis.status || 'ACTIVE')
        setSeverity(diagnosis.severity || 'MODERATE')
        setDiagnosedDate(diagnosis.diagnosedDate || new Date().toISOString().split('T')[0])
        setNotes(diagnosis.notes || '')
        setPatientId(diagnosis.patientId || '')
        setDoctorId(diagnosis.doctorId || '')
      } else {
        setDiagnosisName('')
        setIcd10Code('')
        setDiagnosisType('PRIMARY')
        setStatus('ACTIVE')
        setSeverity('MODERATE')
        setDiagnosedDate(new Date().toISOString().split('T')[0])
        setNotes('')
        setPatientId(defaultPatientId || '')
      }
    }
  }, [isOpen, diagnosis, defaultPatientId])

  const loadMetadata = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])
      setPatients(patRes?.content || [])
      setDoctors(docRes || [])
      if (!diagnosis && docRes && docRes.length > 0 && !doctorId) {
        setDoctorId(docRes[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!diagnosisName.trim()) {
      setError('Diagnosis name is required.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (diagnosis) {
        await emrApi.updateDiagnosis(diagnosis.id, {
          diagnosisName: diagnosisName.trim(),
          icd10Code: icd10Code.trim() || null,
          diagnosisType,
          status,
          severity,
          diagnosedDate,
          notes: notes.trim() || null
        })
      } else {
        if (!patientId) {
          setError('Please select a patient.')
          setSubmitting(false)
          return
        }
        if (!doctorId) {
          setError('Please select a diagnosing doctor.')
          setSubmitting(false)
          return
        }

        await emrApi.addDiagnosis({
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          diagnosisName: diagnosisName.trim(),
          icd10Code: icd10Code.trim() || null,
          diagnosisType,
          status,
          severity,
          diagnosedDate,
          notes: notes.trim() || null
        })
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save diagnosis.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-container" style={{ maxWidth: '580px', width: '95%', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--primary)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={20} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
              {diagnosis ? 'Edit Clinical Diagnosis' : 'Record Clinical Diagnosis'}
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

          {!diagnosis && (
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
                  Doctor <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Diagnosis Name / Condition <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Type 2 Diabetes Mellitus"
              value={diagnosisName}
              onChange={(e) => setDiagnosisName(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                ICD-10 Code
              </label>
              <input
                type="text"
                placeholder="e.g. E11.9"
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Diagnosis Date
              </label>
              <input
                type="date"
                value={diagnosedDate}
                onChange={(e) => setDiagnosedDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Diagnosis Type
              </label>
              <select
                value={diagnosisType}
                onChange={(e) => setDiagnosisType(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="PROVISIONAL">Provisional</option>
                <option value="DIFFERENTIAL">Differential</option>
                <option value="FINAL">Final</option>
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
                <option value="ACTIVE">Active</option>
                <option value="CHRONIC">Chronic</option>
                <option value="RESOLVED">Resolved</option>
                <option value="IN_REMISSION">In Remission</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Clinical Notes / Treatment Plan
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Diet management recommended, HbA1c testing scheduled..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {diagnosis ? 'Save Changes' : 'Record Diagnosis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
