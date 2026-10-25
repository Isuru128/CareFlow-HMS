import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import { patientApi } from '../../patients/api/patientApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import {
  X,
  Plus,
  Trash2,
  Stethoscope,
  Activity,
  HeartPulse,
  Thermometer,
  Weight,
  FileText,
  Pill,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function CreateMedicalRecordModal({ isOpen, onClose, onCreated, defaultPatientId }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [patientId, setPatientId] = useState(defaultPatientId || '')
  const [doctorId, setDoctorId] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [examinationNotes, setExaminationNotes] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [temperatureCelsius, setTemperatureCelsius] = useState('')
  const [heartRateBpm, setHeartRateBpm] = useState('')
  const [respiratoryRateBpm, setRespiratoryRateBpm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [oxygenSaturation, setOxygenSaturation] = useState('')
  const [status, setStatus] = useState('FINALIZED')

  // Initial Diagnoses Builder
  const [diagnoses, setDiagnoses] = useState([])
  const [diagName, setDiagName] = useState('')
  const [diagIcd, setDiagIcd] = useState('')
  const [diagSeverity, setDiagSeverity] = useState('MODERATE')
  const [diagType, setDiagType] = useState('PRIMARY')

  // Initial Prescription Items Builder
  const [prescriptionItems, setPrescriptionItems] = useState([])
  const [rxInstructions, setRxInstructions] = useState('')
  const [medName, setMedName] = useState('')
  const [medDosage, setMedDosage] = useState('')
  const [medFreq, setMedFreq] = useState('Once Daily (OD)')
  const [medRoute, setMedRoute] = useState('ORAL')
  const [medDuration, setMedDuration] = useState('7 Days')
  const [medQty, setMedQty] = useState(1)
  const [medNotes, setMedNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      if (defaultPatientId) setPatientId(defaultPatientId)
    }
  }, [isOpen, defaultPatientId])

  const loadInitialData = async () => {
    try {
      setLoadingMetadata(true)
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])
      setPatients(patRes?.content || [])
      setDoctors(docRes || [])
      if (docRes && docRes.length > 0 && !doctorId) {
        setDoctorId(docRes[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMetadata(false)
    }
  }

  // Calculated BMI
  const computedBmi = () => {
    const w = parseFloat(weightKg)
    const h = parseFloat(heightCm)
    if (w > 0 && h > 0) {
      const hm = h / 100
      return (w / (hm * hm)).toFixed(1)
    }
    return ''
  }

  const handleAddDiagnosis = () => {
    if (!diagName.trim()) return
    setDiagnoses([
      ...diagnoses,
      {
        diagnosisName: diagName.trim(),
        icd10Code: diagIcd.trim(),
        severity: diagSeverity,
        diagnosisType: diagType,
        status: 'ACTIVE'
      }
    ])
    setDiagName('')
    setDiagIcd('')
  }

  const handleRemoveDiagnosis = (idx) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== idx))
  }

  const handleAddPrescriptionItem = () => {
    if (!medName.trim() || !medDosage.trim()) return
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicationName: medName.trim(),
        dosage: medDosage.trim(),
        frequency: medFreq,
        route: medRoute,
        duration: medDuration,
        quantity: parseInt(medQty) || 1,
        instructions: medNotes.trim()
      }
    ])
    setMedName('')
    setMedDosage('')
    setMedNotes('')
  }

  const handleRemovePrescriptionItem = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!patientId) {
      setError('Please select a patient.')
      return
    }
    if (!doctorId) {
      setError('Please select an attending doctor.')
      return
    }
    if (!chiefComplaint.trim()) {
      setError('Chief complaint / visit reason is required.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        chiefComplaint: chiefComplaint.trim(),
        examinationNotes: examinationNotes.trim() || null,
        clinicalNotes: clinicalNotes.trim() || null,
        bloodPressure: bloodPressure.trim() || null,
        temperatureCelsius: temperatureCelsius ? parseFloat(temperatureCelsius) : null,
        heartRateBpm: heartRateBpm ? parseInt(heartRateBpm) : null,
        respiratoryRateBpm: respiratoryRateBpm ? parseInt(respiratoryRateBpm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        bmi: computedBmi() ? parseFloat(computedBmi()) : null,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        status,
        diagnoses: diagnoses.map((d) => ({
          ...d,
          patientId: Number(patientId),
          doctorId: Number(doctorId)
        })),
        prescriptionItems: prescriptionItems.length > 0 ? prescriptionItems : null,
        prescriptionInstructions: rxInstructions.trim() || null
      }

      await emrApi.createMedicalRecord(payload)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical record. Please verify fields.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '900px',
          width: '95%',
          maxHeight: '90vh',
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
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Stethoscope size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>New Clinical Encounter</h3>
              <p style={{ fontSize: '0.8rem', color: '#e0f2fe', margin: 0 }}>
                Record medical consultation, vital signs, diagnoses, and prescriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-light)',
                color: 'var(--danger-hover)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.875rem'
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Patient & Doctor Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} /> Encounter Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Patient <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--surface)'
                  }}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patientNumber} - {p.firstName} {p.lastName} {p.bloodGroup ? `(${p.bloodGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Attending Doctor <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--surface)'
                  }}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Record Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--surface)'
                  }}
                >
                  <option value="FINALIZED">Finalized (Complete)</option>
                  <option value="DRAFT">Draft (Under Review)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Vital Signs */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HeartPulse size={16} /> Clinical Vitals
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  BP (mmHg)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.8"
                  value={temperatureCelsius}
                  onChange={(e) => setTemperatureCelsius(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  placeholder="72"
                  value={heartRateBpm}
                  onChange={(e) => setHeartRateBpm(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Resp Rate (bpm)
                </label>
                <input
                  type="number"
                  placeholder="16"
                  value={respiratoryRateBpm}
                  onChange={(e) => setRespiratoryRateBpm(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  BMI (kg/m²)
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto"
                  value={computedBmi()}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: '#e2e8f0', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Chief Complaint & Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Chief Complaint / Presenting Symptoms <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Patient presents with severe headache for 3 days and episodic dizziness..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Physical Examination Findings
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. S1 S2 normal, chest clear, abdomen soft, no edema..."
                  value={examinationNotes}
                  onChange={(e) => setExaminationNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Clinical Assessment & Plan
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Suspected tension headache with mild hypertension. Advised blood work and lifestyle management..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Diagnoses Added in this Encounter */}
          <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={16} /> Diagnoses ({diagnoses.length})
              </h4>
            </div>

            {/* Diagnosis Input Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Condition / Diagnosis name (e.g. Essential Hypertension)"
                value={diagName}
                onChange={(e) => setDiagName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <input
                type="text"
                placeholder="ICD-10 (e.g. I10)"
                value={diagIcd}
                onChange={(e) => setDiagIcd(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <select
                value={diagSeverity}
                onChange={(e) => setDiagSeverity(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
              <select
                value={diagType}
                onChange={(e) => setDiagType(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="PROVISIONAL">Provisional</option>
              </select>
              <button
                type="button"
                onClick={handleAddDiagnosis}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Added Diagnoses List */}
            {diagnoses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {diagnoses.map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div>
                      <strong>{d.diagnosisName}</strong> {d.icd10Code && <span style={{ color: 'var(--text-muted)' }}>({d.icd10Code})</span>}
                      <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#e2e8f0', fontSize: '0.75rem' }}>
                        {d.severity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiagnosis(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Prescriptions Added in this Encounter */}
          <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Pill size={16} /> Medications / Prescription ({prescriptionItems.length})
              </h4>
            </div>

            {/* Med Input Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.8fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Medication name (e.g. Amoxicillin 500mg)"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 500mg)"
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <select
                value={medFreq}
                onChange={(e) => setMedFreq(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="Once Daily (OD)">Once Daily (OD)</option>
                <option value="Twice Daily (BD)">Twice Daily (BD)</option>
                <option value="Three Times Daily (TDS)">Three Times Daily (TDS)</option>
                <option value="Four Times Daily (QDS)">Four Times Daily (QDS)</option>
                <option value="As Needed (PRN)">As Needed (PRN)</option>
              </select>
              <input
                type="text"
                placeholder="Duration (e.g. 7 Days)"
                value={medDuration}
                onChange={(e) => setMedDuration(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={medQty}
                onChange={(e) => setMedQty(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={handleAddPrescriptionItem}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Added Prescriptions List */}
            {prescriptionItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {prescriptionItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div>
                      <strong>{item.medicationName}</strong> - {item.dosage} | {item.frequency} | {item.duration} (Qty: {item.quantity})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePrescriptionItem(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-md)',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </>
              ) : (
                'Save Encounter Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
