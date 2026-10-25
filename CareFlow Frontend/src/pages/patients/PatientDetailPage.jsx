import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { patientApi } from '../../features/patients/api/patientApi'
import PatientStatusBadge from '../../features/patients/components/PatientStatusBadge'
import PatientModal from '../../features/patients/components/PatientModal'
import MedicalHistoryModal from '../../features/patients/components/MedicalHistoryModal'
import DocumentUploadModal from '../../features/patients/components/DocumentUploadModal'
import PatientEmrSummaryModal from '../../features/emr/components/PatientEmrSummaryModal'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Stethoscope,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Edit2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  Activity,
  HeartPulse
} from 'lucide-react'

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [patient, setPatient] = useState(null)
  const [medicalHistories, setMedicalHistories] = useState([])
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('medical-history') // 'medical-history' | 'documents'
  const [documentTypeFilter, setDocumentTypeFilter] = useState('ALL')

  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [feedback, setFeedback] = useState({ error: '', success: '' })

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyToEdit, setHistoryToEdit] = useState(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)

  // Role checks
  const canManageMedical = user?.roles?.some((r) =>
    ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE'].includes(r)
  )
  const canUploadDocs = user?.roles?.some((r) =>
    ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_LABORATORY_STAFF', 'ROLE_RECEPTIONIST'].includes(r)
  )
  const canDeleteDocs = user?.roles?.some((r) =>
    ['ROLE_ADMIN', 'ROLE_DOCTOR'].includes(r)
  )

  const fetchPatientDetails = async () => {
    try {
      const data = await patientApi.getPatientById(id)
      setPatient(data)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to fetch patient details.',
        success: ''
      })
    }
  }

  const fetchMedicalHistories = async () => {
    try {
      const data = await patientApi.getMedicalHistories(id)
      setMedicalHistories(data || [])
    } catch (err) {
      // Ignored if user has no permission
    }
  }

  const fetchDocuments = async (docType = documentTypeFilter) => {
    try {
      const data = await patientApi.getDocuments(id, docType)
      setDocuments(data || [])
    } catch (err) {
      // Ignored if user has no permission
    }
  }

  const loadAll = async () => {
    setLoading(true)
    await fetchPatientDetails()
    await Promise.all([fetchMedicalHistories(), fetchDocuments(documentTypeFilter)])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [id])

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments(documentTypeFilter)
    }
  }, [documentTypeFilter, activeTab])

  const calculateAge = (dobString) => {
    if (!dobString) return '—'
    const dob = new Date(dobString)
    const diffMs = Date.now() - dob.getTime()
    const ageDt = new Date(diffMs)
    return Math.abs(ageDt.getUTCFullYear() - 1970) + ' years old'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'LAB_REPORT':
        return <span className="badge badge-doc" style={{ background: '#ecfdf5', color: '#065f46' }}>Lab Report</span>
      case 'SCAN':
        return <span className="badge badge-doc" style={{ background: '#f5f3ff', color: '#5b21b6' }}>Radiology / Scan</span>
      case 'PRESCRIPTION':
        return <span className="badge badge-doc" style={{ background: '#fef3c7', color: '#92400e' }}>Prescription</span>
      case 'DISCHARGE_SUMMARY':
        return <span className="badge badge-doc" style={{ background: '#e0f2fe', color: '#0369a1' }}>Discharge Summary</span>
      case 'ID_PROOF':
        return <span className="badge badge-doc" style={{ background: '#f1f5f9', color: '#334155' }}>ID Proof</span>
      default:
        return <span className="badge badge-doc">{type}</span>
    }
  }

  const getFileIcon = (fileType = '') => {
    if (fileType.includes('pdf')) return <FileText size={24} color="#ef4444" />
    if (fileType.includes('image')) return <ImageIcon size={24} color="#0284c7" />
    if (fileType.includes('sheet') || fileType.includes('csv') || fileType.includes('excel'))
      return <FileSpreadsheet size={24} color="#10b981" />
    return <File size={24} color="#64748b" />
  }

  const handleDownloadDoc = async (doc) => {
    try {
      await patientApi.downloadDocument(id, doc.id, doc.fileName)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to download document file.',
        success: ''
      })
    }
  }

  const handleDeleteDoc = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.documentName}"?`)) return

    try {
      await patientApi.deleteDocument(id, doc.id)
      setFeedback({ error: '', success: 'Document removed successfully.' })
      fetchDocuments(documentTypeFilter)
      fetchPatientDetails()
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Could not delete document.',
        success: ''
      })
    }
  }

  const handleDeleteHistory = async (history) => {
    if (!window.confirm(`Delete diagnosis entry "${history.conditionOrDiagnosis}"?`)) return

    try {
      await patientApi.deleteMedicalHistory(id, history.id)
      setFeedback({ error: '', success: 'Medical history record removed.' })
      fetchMedicalHistories()
      fetchPatientDetails()
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Could not delete medical record.',
        success: ''
      })
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} color="var(--primary)" />
        <p style={{ fontWeight: 600 }}>Loading electronic medical record...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>Patient record not found.</p>
        <Link to="/patients" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/patients" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Patient Directory
        </Link>
      </div>

      {/* Alerts */}
      {feedback.error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{feedback.error}</span>
        </div>
      )}
      {feedback.success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* Patient Profile Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.25)'
            }}>
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {patient.firstName} {patient.lastName}
                </h1>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {patient.patientNumber}
                </span>
                <PatientStatusBadge status={patient.status} />
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Gender: <strong style={{ color: 'var(--text-main)' }}>{patient.gender}</strong></span>
                <span>Age: <strong style={{ color: 'var(--text-main)' }}>{calculateAge(patient.dateOfBirth)}</strong></span>
                <span>DOB: <strong style={{ color: 'var(--text-main)' }}>{patient.dateOfBirth}</strong></span>
                {patient.bloodGroup && (
                  <span>Blood: <span className="badge badge-blood">{patient.bloodGroup}</span></span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 size={15} /> Edit Patient
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => setIsSummaryModalOpen(true)}
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              <HeartPulse size={15} /> EMR Health Chart
            </button>

            {canManageMedical && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setHistoryToEdit(null)
                  setIsHistoryModalOpen(true)
                }}
              >
                <Stethoscope size={15} /> Add Medical Record
              </button>
            )}

            {canUploadDocs && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setIsDocModalOpen(true)}
              >
                <UploadCloud size={15} /> Upload Document
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Baseline Information Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Contact Information */}
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={15} /> Contact & Identification
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Phone Number</span>
              <strong>{patient.contactNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Email Address</span>
              <strong>{patient.email || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>NIC / Passport</span>
              <strong>{patient.nicOrPassport || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Residential Address</span>
              <span>{patient.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={15} /> Emergency Contact
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Contact Name</span>
              <strong>{patient.emergencyContactName || 'None listed'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Phone Number</span>
              <strong>{patient.emergencyContactNumber || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Relationship</span>
              <strong>{patient.emergencyContactRelation || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Clinical Baseline & Allergies */}
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={15} /> Clinical Baseline & Allergies
          </div>

          {patient.allergies ? (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              color: '#9f1239',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <AlertTriangle size={15} /> Known Allergies / Sensitivities
              </div>
              <p>{patient.allergies}</p>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              No documented medication or food allergies.
            </p>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <div>Registered By: <strong>{patient.registeredByName || 'System'}</strong></div>
            <div>Registered On: {new Date(patient.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs: Medical History vs Documents */}
      <div className="tab-bar">
        <button
          className={`tab-button ${activeTab === 'medical-history' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical-history')}
        >
          <Stethoscope size={18} />
          <span>Medical History & Diagnoses ({medicalHistories.length})</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <Paperclip size={18} />
          <span>Attached Documents & Scans ({documents.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Medical History */}
      {activeTab === 'medical-history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Clinical Diagnostic History</h2>
            {canManageMedical && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setHistoryToEdit(null)
                  setIsHistoryModalOpen(true)
                }}
              >
                <Stethoscope size={15} /> Record Diagnosis
              </button>
            )}
          </div>

          {medicalHistories.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Stethoscope size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                No medical history recorded yet
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Add patient diagnostic records, treatment procedures, and prescription regimens.
              </p>
              {canManageMedical && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setHistoryToEdit(null)
                    setIsHistoryModalOpen(true)
                  }}
                >
                  Add First Medical Record
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {medicalHistories.map((history) => (
                <div key={history.id} className="card card-hover" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {history.conditionOrDiagnosis}
                        </h3>
                        {history.diagnosisDate && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} /> {history.diagnosisDate}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Recorded by {history.recordedByName || 'Staff Clinician'} on {new Date(history.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {canManageMedical && (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setHistoryToEdit(history)
                            setIsHistoryModalOpen(true)
                          }}
                          title="Edit medical diagnosis"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteHistory(history)}
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                    {history.medications && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                          Prescribed Medications
                        </span>
                        <div style={{ color: 'var(--text-main)' }}>{history.medications}</div>
                      </div>
                    )}

                    {history.treatment && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                          Treatment Plan
                        </span>
                        <div style={{ color: 'var(--text-main)' }}>{history.treatment}</div>
                      </div>
                    )}

                    {history.surgeries && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                          Surgeries / Procedures
                        </span>
                        <div style={{ color: 'var(--text-main)' }}>{history.surgeries}</div>
                      </div>
                    )}
                  </div>

                  {history.notes && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                        Clinical Notes
                      </span>
                      <p style={{ color: '#475569', fontStyle: 'italic' }}>"{history.notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Documents */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Electronic Documents & Reports</h2>
              <div style={{ width: '190px' }}>
                <select
                  className="form-select"
                  style={{ height: '34px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  value={documentTypeFilter}
                  onChange={(e) => setDocumentTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  <option value="LAB_REPORT">Lab Reports</option>
                  <option value="SCAN">Scans & Imaging</option>
                  <option value="PRESCRIPTION">Prescriptions</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summaries</option>
                  <option value="ID_PROOF">ID & Insurance</option>
                  <option value="OTHER">Other Documents</option>
                </select>
              </div>
            </div>

            {canUploadDocs && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsDocModalOpen(true)}>
                <UploadCloud size={15} /> Upload Document
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UploadCloud size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                No documents uploaded yet
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Upload pathology reports, radiological scans, prescriptions, or patient identity proofs.
              </p>
              {canUploadDocs && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsDocModalOpen(true)}>
                  Upload Document Now
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {documents.map((doc) => (
                <div key={doc.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getFileIcon(doc.fileType)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '0.2rem',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }} title={doc.documentName}>
                          {doc.documentName}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {doc.fileName}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {getDocTypeBadge(doc.documentType)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>

                    {doc.notes && (
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        "{doc.notes}"
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <div>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadDoc(doc)}
                        title="Download file"
                      >
                        <Download size={14} /> Download
                      </button>

                      {canDeleteDocs && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteDoc(doc)}
                          title="Delete file"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Patient Modal */}
      <PatientModal
        isOpen={isEditModalOpen}
        patientToEdit={patient}
        onClose={() => setIsEditModalOpen(false)}
        onPatientSaved={(updated) => {
          setPatient(updated)
          setFeedback({ error: '', success: 'Patient profile updated successfully.' })
        }}
      />

      {/* Add / Edit Medical History Modal */}
      <MedicalHistoryModal
        isOpen={isHistoryModalOpen}
        patientId={id}
        historyToEdit={historyToEdit}
        onClose={() => setIsHistoryModalOpen(false)}
        onHistorySaved={() => {
          fetchMedicalHistories()
          fetchPatientDetails()
          setFeedback({ error: '', success: 'Medical history record saved.' })
        }}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        patientId={id}
        onClose={() => setIsDocModalOpen(false)}
        onDocumentUploaded={() => {
          fetchDocuments(documentTypeFilter)
          fetchPatientDetails()
          setFeedback({ error: '', success: 'Patient document uploaded successfully.' })
        }}
      />

      {/* Full EMR Health Chart Modal */}
      <PatientEmrSummaryModal
        isOpen={isSummaryModalOpen}
        patientId={id}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </div>
  )
}
