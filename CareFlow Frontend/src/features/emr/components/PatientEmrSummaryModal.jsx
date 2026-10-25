import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import EmrStatusBadge from './EmrStatusBadge'
import {
  X,
  HeartPulse,
  Activity,
  Pill,
  FileText,
  ShieldAlert,
  Phone,
  User,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function PatientEmrSummaryModal({ isOpen, onClose, patientId, onOpenRecordDetail }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && patientId) {
      fetchSummary()
    }
  }, [isOpen, patientId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await emrApi.getPatientEmrSummary(patientId)
      setSummary(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient health chart.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HeartPulse size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                {summary ? `${summary.fullName} - EMR Health Summary` : 'Patient Health Record'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#bae6fd', margin: 0 }}>
                {summary ? `Patient ID: ${summary.patientNumber} | Age: ${summary.age || 'N/A'} yrs | Blood Group: ${summary.bloodGroup || 'Unknown'}` : 'Loading profile...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            </div>
          ) : error ? (
            <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          ) : summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Banner: Allergies & Emergency Contact */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={18} color={summary.allergies ? 'var(--danger)' : 'var(--success)'} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Known Allergies:</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: summary.allergies ? 'var(--danger)' : 'var(--text-main)' }}>
                      {summary.allergies || 'No known allergies reported'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={18} color="var(--primary)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Emergency Contact:</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {summary.emergencyContact || summary.contactNumber || 'None specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Vitals Bar */}
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>
                  Latest Measured Vitals
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.4rem' }}>
                  <div style={{ padding: '0.65rem', background: '#f0fdf4', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>Blood Pressure</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14532d', marginTop: '0.15rem' }}>
                      {summary.latestBloodPressure || '--'}
                    </div>
                  </div>
                  <div style={{ padding: '0.65rem', background: '#eff6ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 600 }}>Heart Rate</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e3a8a', marginTop: '0.15rem' }}>
                      {summary.latestHeartRate || '--'}
                    </div>
                  </div>
                  <div style={{ padding: '0.65rem', background: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 600 }}>Temperature</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#78350f', marginTop: '0.15rem' }}>
                      {summary.latestTemperature || '--'}
                    </div>
                  </div>
                  <div style={{ padding: '0.65rem', background: '#f5f3ff', borderRadius: 'var(--radius-md)', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#5b21b6', fontWeight: 600 }}>Body Mass Index (BMI)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4c1d95', marginTop: '0.15rem' }}>
                      {summary.latestBmi || '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Conditions */}
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                  Active Clinical Diagnoses ({summary.activeDiagnoses?.length || 0})
                </span>
                {summary.activeDiagnoses && summary.activeDiagnoses.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
                    {summary.activeDiagnoses.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{d.diagnosisName}</strong>
                          {d.icd10Code && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>[{d.icd10Code}]</span>}
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Diagnosed: {d.diagnosedDate}</div>
                        </div>
                        <EmrStatusBadge status={d.severity} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.3rem' }}>
                    No active or chronic diagnoses on file.
                  </div>
                )}
              </div>

              {/* Active Prescriptions */}
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                  Current Active Prescriptions ({summary.activePrescriptions?.length || 0})
                </span>
                {summary.activePrescriptions && summary.activePrescriptions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                    {summary.activePrescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Rx #{rx.prescriptionNumber}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dr. {rx.doctorName} (Issued: {rx.issueDate})</span>
                        </div>
                        {rx.items && (
                          <div style={{ marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {rx.items.map((it) => (
                              <span
                                key={it.id}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  background: 'var(--surface-alt)',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                {it.medicationName} ({it.dosage} - {it.frequency})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.3rem' }}>
                    No active prescription orders currently running.
                  </div>
                )}
              </div>

              {/* Recent Consultations Timeline */}
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                  Recent Consultation Encounters ({summary.recentRecords?.length || 0})
                </span>
                {summary.recentRecords && summary.recentRecords.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                    {summary.recentRecords.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => onOpenRecordDetail && onOpenRecordDetail(r.id)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: onOpenRecordDetail ? 'pointer' : 'default'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{r.recordNumber}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            {new Date(r.visitDate).toLocaleDateString()} with {r.doctorName}
                          </span>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                            {r.chiefComplaint}
                          </div>
                        </div>
                        <EmrStatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.3rem' }}>
                    No past consultation records on file.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: '#ffffff' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  )
}
