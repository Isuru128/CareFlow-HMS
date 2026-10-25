import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import { patientApi } from '../../patients/api/patientApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import { X, FileText, Loader2, AlertCircle } from 'lucide-react'

export default function MedicalReportModal({ isOpen, onClose, onSaved, report = null, defaultPatientId }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportType, setReportType] = useState('CLINICAL_SUMMARY')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [clinicalFindings, setClinicalFindings] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('FINALIZED')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadMetadata()
      if (report) {
        setReportTitle(report.reportTitle || '')
        setReportType(report.reportType || 'CLINICAL_SUMMARY')
        setReportDate(report.reportDate || new Date().toISOString().split('T')[0])
        setClinicalFindings(report.clinicalFindings || '')
        setRecommendations(report.recommendations || '')
        setSummary(report.summary || '')
        setStatus(report.status || 'FINALIZED')
        setPatientId(report.patientId || '')
        setDoctorId(report.doctorId || '')
      } else {
        setReportTitle('')
        setReportType('CLINICAL_SUMMARY')
        setReportDate(new Date().toISOString().split('T')[0])
        setClinicalFindings('')
        setRecommendations('')
        setSummary('')
        setStatus('FINALIZED')
        setPatientId(defaultPatientId || '')
      }
    }
  }, [isOpen, report, defaultPatientId])

  const loadMetadata = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])
      setPatients(patRes?.content || [])
      setDoctors(docRes || [])
      if (!report && docRes && docRes.length > 0 && !doctorId) {
        setDoctorId(docRes[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reportTitle.trim()) {
      setError('Report title is required.')
      return
    }
    if (!clinicalFindings.trim()) {
      setError('Clinical findings are required.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (report) {
        await emrApi.updateReport(report.id, {
          reportTitle: reportTitle.trim(),
          reportType,
          reportDate,
          clinicalFindings: clinicalFindings.trim(),
          recommendations: recommendations.trim() || null,
          summary: summary.trim() || null,
          status
        })
      } else {
        if (!patientId) {
          setError('Please select a patient.')
          setSubmitting(false)
          return
        }
        if (!doctorId) {
          setError('Please select an authoring doctor.')
          setSubmitting(false)
          return
        }

        await emrApi.createReport({
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          reportTitle: reportTitle.trim(),
          reportType,
          reportDate,
          clinicalFindings: clinicalFindings.trim(),
          recommendations: recommendations.trim() || null,
          summary: summary.trim() || null,
          status
        })
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical report.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-container" style={{ maxWidth: '680px', width: '95%', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: '#0284c7', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
              {report ? 'Edit Medical Report' : 'Author Medical Report'}
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

          {!report && (
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
                  Authoring Doctor <span style={{ color: 'var(--danger)' }}>*</span>
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
                      Dr. {d.firstName} {d.lastName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Report Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Comprehensive Cardiovascular Evaluation Report"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="CLINICAL_SUMMARY">Clinical Summary</option>
                <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                <option value="CONSULTATION_NOTE">Consultation Note</option>
                <option value="DIAGNOSTIC_SUMMARY">Diagnostic Summary</option>
                <option value="SPECIALIST_REFERRAL">Specialist Referral</option>
                <option value="HEALTH_ASSESSMENT">Health Assessment</option>
                <option value="OTHER">Other Clinical Report</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Report Date
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
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
                <option value="FINALIZED">Finalized</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Detailed Clinical Findings <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Diagnostic results, examination observations, pathology and radiological indicators..."
              value={clinicalFindings}
              onChange={(e) => setClinicalFindings(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Medical Recommendations & Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Continue medication regimen, schedule stress test, salt restriction..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Prognostic Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Good recovery expected with optimal medication compliance and follow-up in 1 month"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
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
              {report ? 'Save Changes' : 'Issue Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
