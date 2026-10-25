import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import EmrStatusBadge from './EmrStatusBadge'
import {
  X,
  FileText,
  Activity,
  HeartPulse,
  Pill,
  ShieldAlert,
  Calendar,
  User,
  Stethoscope,
  Printer,
  CheckCircle,
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react'

export default function MedicalRecordDetailModal({ isOpen, onClose, recordId, onUpdated }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && recordId) {
      fetchDetail()
    }
  }, [isOpen, recordId])

  const fetchDetail = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await emrApi.getMedicalRecordById(recordId)
      setRecord(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch medical record details.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    try {
      setFinalizing(true)
      await emrApi.finalizeMedicalRecord(recordId)
      fetchDetail()
      if (onUpdated) onUpdated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize record.')
    } finally {
      setFinalizing(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  {record ? record.recordNumber : 'Consultation Record'}
                </h3>
                {record && <EmrStatusBadge status={record.status} />}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                {record ? `Encounter Date: ${new Date(record.visitDate).toLocaleString()}` : 'Loading...'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.35rem'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '260px' }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            </div>
          ) : error ? (
            <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          ) : record ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Patient & Doctor Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Patient Profile
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {record.patientName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    ID: <strong>{record.patientNumber}</strong> | Gender: {record.patientGender} | Blood Group: <strong>{record.patientBloodGroup || 'N/A'}</strong>
                  </div>
                  {record.patientAllergies && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)', fontSize: '0.825rem', fontWeight: 600 }}>
                      <ShieldAlert size={14} /> Allergies: {record.patientAllergies}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Consulting Clinician
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {record.doctorName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Specialization: <strong>{record.doctorSpecialization}</strong>
                  </div>
                  {record.appointmentNumber && (
                    <div style={{ fontSize: '0.825rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      Linked Appointment: <strong>{record.appointmentNumber}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Vitals Grid */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HeartPulse size={16} color="var(--primary)" /> Physiological Vital Signs
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Blood Pressure</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{record.bloodPressure || '--'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heart Rate</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{record.heartRateBpm ? `${record.heartRateBpm} bpm` : '--'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temperature</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{record.temperatureCelsius ? `${record.temperatureCelsius} °C` : '--'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resp. Rate</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{record.respiratoryRateBpm ? `${record.respiratoryRateBpm} bpm` : '--'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight / Height</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                      {record.weightKg ? `${record.weightKg} kg` : '--'} / {record.heightCm ? `${record.heightCm} cm` : '--'}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>BMI</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7', marginTop: '0.2rem' }}>{record.bmi || '--'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SpO2</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{record.oxygenSaturation ? `${record.oxygenSaturation}%` : '--'}</div>
                  </div>
                </div>
              </div>

              {/* Chief Complaint & Clinical Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Chief Complaint & Reason for Visit
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                    {record.chiefComplaint}
                  </p>
                </div>

                <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Physical Examination
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                    {record.examinationNotes || 'No specific physical examination notes recorded.'}
                  </p>
                </div>
              </div>

              {record.clinicalNotes && (
                <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Clinical Assessment & Follow-up Instructions
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                    {record.clinicalNotes}
                  </p>
                </div>
              )}

              {/* Diagnoses Section */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={16} color="var(--primary)" /> Diagnosed Conditions ({record.diagnoses?.length || 0})
                </h4>
                {record.diagnoses && record.diagnoses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {record.diagnoses.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'var(--surface-alt)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.diagnosisName}</span>
                          {d.icd10Code && <span style={{ marginLeft: '0.4rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>[ICD: {d.icd10Code}]</span>}
                          {d.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{d.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <EmrStatusBadge status={d.severity} />
                          <EmrStatusBadge status={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No diagnoses recorded during this consultation encounter.
                  </div>
                )}
              </div>

              {/* Prescriptions Section */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Pill size={16} color="var(--primary)" /> Prescriptions Issued ({record.prescriptions?.length || 0})
                </h4>
                {record.prescriptions && record.prescriptions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {record.prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div>
                            <strong>Rx Number: {rx.prescriptionNumber}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.6rem' }}>
                              Issued: {rx.issueDate} {rx.validUntil ? `| Valid until: ${rx.validUntil}` : ''}
                            </span>
                          </div>
                          <EmrStatusBadge status={rx.status} />
                        </div>

                        {rx.items && rx.items.length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {rx.items.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '0.85rem',
                                  padding: '0.35rem 0.6rem',
                                  background: 'var(--surface-alt)',
                                  borderRadius: '4px'
                                }}
                              >
                                <div>
                                  <strong>{item.medicationName}</strong> - {item.dosage} ({item.route})
                                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                                    {item.frequency} | {item.duration} {item.instructions ? `| Notes: ${item.instructions}` : ''}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.isDispensed ? 'var(--success)' : 'var(--warning)' }}>
                                  {item.isDispensed ? '✓ Dispensed' : 'Pending Dispense'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No medications prescribed in this encounter.
                  </div>
                )}
              </div>

              {/* Treatment History Section */}
              {record.treatmentHistories && record.treatmentHistories.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
                    Procedures & Treatments Conducted
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {record.treatmentHistories.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'var(--surface-alt)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <strong>{t.treatmentName}</strong> ({t.category?.replace(/_/g, ' ')})
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.procedureNotes}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <EmrStatusBadge status={t.status} />
                          {t.outcome && <EmrStatusBadge status={t.outcome} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Recorded by: <strong>{record?.createdByName || 'Attending Staff'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {record && record.status === 'DRAFT' && (
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {finalizing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Finalize Record
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
